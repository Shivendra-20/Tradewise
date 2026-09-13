import WebSocket from "ws";
import protobuf from "protobufjs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import Stock from "../models/Stock.js";
import { getAccessToken } from "./upstox.service.js";
import {
  getInstrumentKey,
  getSymbolFromKey,
  INDEX_KEYS,
  normalizeSymbol,
} from "./upstoxInstruments.js";
import { fetchYahooMeta } from "./yahoo.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_FILE = path.join(__dirname, "MarketDataFeedV3.proto");
const FEED_RESPONSE_TYPE = "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse";

const UPSTOX_BASE_URL =
  process.env.UPSTOX_API_BASE_URL?.replace(/\/+$/, "") || "https://api.upstox.com";
const FEED_AUTHORIZE_PATH = "/v3/feed/market-data-feed/authorize";

const DB_SYNC_INTERVAL_MS = 15000;
const YAHOO_POLL_INTERVAL_MS = 15000;
const YAHOO_BATCH_SIZE = 5;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  ws: null,
  io: null,
  connected: false,
  retryTimer: null,
  retryCount: 0,
  shouldRun: false,
  subscribedKeys: new Set(),
  keyToSymbol: new Map(),
  latestQuotes: new Map(),
  lastDbSync: new Map(),
  lastTickLog: 0,
  FeedResponse: null,
  yahooPollTimer: null,
  yahooPollRunning: false,
};

// Curated liquid NSE names — subscribed so the dashboard/market page is always live.
const POPULAR_SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "BHARTIARTL",
  "ITC", "LT", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "BAJFINANCE", "M&M",
  "TATAMOTORS", "MARUTI", "TITAN", "SUNPHARMA", "ULTRACEMCO", "NTPC",
  "POWERGRID", "ADANIENT", "ADANIPORTS", "JSWSTEEL", "TATASTEEL", "WIPRO",
  "TECHM", "HCLTECH", "ASIANPAINT", "BAJAJFINSV", "DRREDDY", "CIPLA",
  "DIVISLAB", "GRASIM", "HEROMOTOCO", "INDUSINDBK", "LTIM", "SBILIFE",
  "HINDALCO", "ONGC", "COALINDIA", "BPCL", "IOC", "GAIL", "TATAPOWER",
  "HDFCLIFE", "BAJAJ-AUTO", "EICHERMOT", "TATACONSUM", "NESTLEIND",
  "BRITANNIA", "DABUR", "GODREJCP", "HINDZINC", "PIDILITIND", "COLPAL",
  "HAVELLS", "TORNTPHARM", "BHARATFORG", "BANKBARODA", "PNB", "CANBK",
  "RECLTD", "PFC", "IRFC", "CHOLAFIN", "MARICO", "JUBLFOOD", "DMART",
  "BERGEPAINT", "SIEMENS", "VOLTAS", "CUMMINSIND", "TVSMOTOR", "MUTHOOTFIN",
  "POLYCAB", "ZOMATO", "IRCTC", "INDIGO", "HAL", "BEL", "VEDL", "NMDC",
  "SAIL", "YESBANK", "IDFCFIRSTB", "AUBANK", "BANDHANBNK", "TATAELXSI",
  "ABB", "TRENT", "VBL", "HUDCO", "FEDERALBNK", "JINDALSTEL", "DLF",
  "APOLLOHOSP", "PAGEIND", "ATGL", "PNBHOUSING",
];

// ---------------------------------------------------------------------------
// Proto loading
// ---------------------------------------------------------------------------

//loadProto() — .proto file ko ek baar load karke cache kar leta hai (state.FeedResponse), 
// taaki har message pe dobara file na parse karni pade
async function loadProto() {
  if (state.FeedResponse) return state.FeedResponse;
  const root = await protobuf.load(PROTO_FILE);
  state.FeedResponse = root.lookupType(FEED_RESPONSE_TYPE);
  return state.FeedResponse;
}

// ---------------------------------------------------------------------------
// Instrument key helpers
// ---------------------------------------------------------------------------

//resolveInstrumentKey(symbol) — "RELIANCE" → NSE_EQ|... key nikalta hai, aur reverse mapping bhi cache kar leta hai (keyToSymbol)
async function resolveInstrumentKey(symbol) {
  const normalized = normalizeSymbol(symbol);

  if (INDEX_KEYS[normalized]) {
    state.keyToSymbol.set(INDEX_KEYS[normalized], normalized);
    return INDEX_KEYS[normalized];
  }

  const key = await getInstrumentKey(normalized);
  if (key) state.keyToSymbol.set(key, normalized);
  return key;
}

//resolveSymbolFromKey(instrumentKey) — Reverse: key se symbol nikalta hai. Pehle cache check karta hai, phir DB/instrument list mein
async function resolveSymbolFromKey(instrumentKey) {
  if (state.keyToSymbol.has(instrumentKey)) return state.keyToSymbol.get(instrumentKey);

  const symbol = await getSymbolFromKey(instrumentKey);
  if (symbol) state.keyToSymbol.set(instrumentKey, symbol);
  return symbol;
}

// ---------------------------------------------------------------------------
// Message decoding (protobuf -> plain ticks)
// ---------------------------------------------------------------------------

//extractTicks(payload) — Decoded protobuf se actual price/OHLC data nikalta hai. 
// Upstox ka format nested hai (fullFeed.marketFF ya indexFF ya ltpc), 
// ye unwrap karke ek simple tick object banata hai
function extractTicks(payload) {
  const ticks = [];
  const feeds = payload?.feeds || {};

  for (const instrumentKey of Object.keys(feeds)) {
    const feed = feeds[instrumentKey];
    if (!feed) continue;

    // v3: Feed.oneof -> ltpc | fullFeed(marketFF|indexFF) | firstLevelWithGreeks
    const data =
      feed.fullFeed?.marketFF || feed.fullFeed?.indexFF || feed.firstLevelWithGreeks || feed.ltpc;
    if (!data) continue;

    const ltpc = data.ltpc || data;
    const ohlc = data.marketOHLC?.ohlc?.[0] || {};

    const price = ltpc.ltp;
    const close = ltpc.cp ?? data.cp ?? data.lastClose;
    if (price == null) continue;

    const change = price - close;
    const changePercent = close > 0 ? (change / close) * 100 : 0;

    ticks.push({
      instrumentKey,
      symbol: instrumentKey, // resolved below (async, outside the loop)
      price,
      open: ohlc.open ?? null,
      high: ohlc.high ?? null,
      low: ohlc.low ?? null,
      close: close ?? null,
      change,
      changePercent,
      volume: data.vtt ?? ltpc.ltq ?? ohlc.vol ?? null,
      timestamp: ltpc.ltt ? ltpc.ltt : Date.now(),
    });
  }

  return ticks;
}

// ---------------------------------------------------------------------------
// DB sync (throttled) — keeps Stock.currentPrice fresh for order execution
// ---------------------------------------------------------------------------

//syncStockToDb(tick, symbol) — Stock document ka price update karta hai MongoDB mein 
// — throttled (15 sec mein ek baar per symbol), taaki har tick pe DB na hit ho
async function syncStockToDb(tick, symbol) {
  const now = Date.now();
  const last = state.lastDbSync.get(symbol) || 0;
  if (now - last < DB_SYNC_INTERVAL_MS) return;

  state.lastDbSync.set(symbol, now);

  try {
    await Stock.updateOne(
      { symbol },
      {
        $set: {
          currentPrice: tick.price,
          previousClose: tick.close ?? 0,
          change: tick.change ?? 0,
          changePercent: tick.changePercent ?? 0,
          dayHigh: tick.high ?? 0,
          dayLow: tick.low ?? 0,
          volume: tick.volume ?? 0,
          lastUpdated: new Date(tick.timestamp),
        },
      }
    );
  } catch (error) {
    console.error(`[marketDataFeed] DB sync failed for ${symbol}:`, error.message);
  }
}

// ---------------------------------------------------------------------------
// Yahoo Finance fallback polling (when Upstox is unreachable)
// ---------------------------------------------------------------------------

//yahooPollTick() — Har 15 sec mein Yahoo se quotes polls karta hai (5-5 symbols ke batch mein),
//  phir sabko market:tick event se emit karta hai
async function yahooPollTick() {
  if (state.yahooPollRunning || state.connected || !state.io) return;
  state.yahooPollRunning = true;

  try {
    const symbols = Array.from(state.keyToSymbol.values());
    if (symbols.length === 0) return;

    const ticks = [];

    for (let i = 0; i < symbols.length; i += YAHOO_BATCH_SIZE) {
      const batch = symbols.slice(i, i + YAHOO_BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((sym) => fetchYahooMeta({ symbol: sym })));

      for (const result of results) {
        if (result.status !== "fulfilled" || !result.value?.price) continue;
        const m = result.value;

        const tick = {
          symbol: m.symbol,
          price: m.price,
          change: m.change ?? 0,
          changePercent: m.changePercent ?? 0,
          open: null,
          high: m.dayHigh ?? null,
          low: m.dayLow ?? null,
          close: m.previousClose ?? null,
          volume: m.volume ?? null,
          timestamp: Date.now(),
        };

        state.latestQuotes.set(m.symbol, tick);
        ticks.push(tick);
        syncStockToDb(tick, m.symbol);
      }

      if (i + YAHOO_BATCH_SIZE < symbols.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (ticks.length > 0) {
      state.io.emit("market:tick", { ticks });

      const now = Date.now();
      if (now - state.lastTickLog > 30000) {
        state.lastTickLog = now;
        console.log(`[marketDataFeed] Yahoo fallback: emitted ${ticks.length} ticks`);
      }
    }
  } catch (error) {
    console.error("[marketDataFeed] Yahoo poll error:", error.message);
  } finally {
    state.yahooPollRunning = false;
  }
}

//startYahooFallback() / stopYahooFallback() — Polling interval start/stop karte hain
function startYahooFallback() {
  if (state.yahooPollTimer) return;
  console.log("[marketDataFeed] Upstox unavailable — starting Yahoo Finance fallback polling");
  state.yahooPollTimer = setInterval(yahooPollTick, YAHOO_POLL_INTERVAL_MS);
  yahooPollTick();
}

function stopYahooFallback() {
  if (!state.yahooPollTimer) return;
  clearInterval(state.yahooPollTimer);
  state.yahooPollTimer = null;
  console.log("[marketDataFeed] Upstox reconnected — stopping Yahoo fallback");
}

// ---------------------------------------------------------------------------
// Feed connection
// ---------------------------------------------------------------------------

//sendSubscriptions() / sendUnsubscriptions() — WebSocket ko batata hai kaunse instruments ka data chahiye
function sendSubscriptions() {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN || state.subscribedKeys.size === 0) return;

  state.ws.send(
    Buffer.from(
      JSON.stringify({
        guid: `sub-${Date.now()}`,
        method: "sub",
        data: { mode: "full", instrumentKeys: Array.from(state.subscribedKeys) },
      })
    )
  );
}

function sendUnsubscriptions(keys) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN || keys.length === 0) return;

  state.ws.send(
    Buffer.from(
      JSON.stringify({
        guid: `unsub-${Date.now()}`,
        method: "unsub",
        data: { instrumentKeys: keys },
      })
    )
  );
}

//connect() — Sabse important: token leke Upstox se auth karta hai,
//  WebSocket connect karta hai, aur open/message/close/error events handle karta hai
async function connect() {
  if (!state.shouldRun) return;

  try {
    const token = await getAccessToken();

    const authResponse = await axios.get(`${UPSTOX_BASE_URL}${FEED_AUTHORIZE_PATH}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });

    if (authResponse.status < 200 || authResponse.status >= 300) {
      throw new Error(`Feed authorize failed: ${authResponse.status} ${JSON.stringify(authResponse.data)}`);
    }

    const socketUrl = authResponse.data?.data?.authorizedRedirectUri;
    if (!socketUrl) throw new Error("Feed authorize returned no socket URL");

    const ws = new WebSocket(socketUrl, { followRedirects: true });

    ws.on("open", () => {
      console.log("[marketDataFeed] Connected to Upstox market feed");
      state.connected = true;
      state.retryCount = 0;
      stopYahooFallback();
      sendSubscriptions();
    });

    ws.on("message", async (data) => {
      try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const FeedResponse = await loadProto();
        const decoded = FeedResponse.decode(new Uint8Array(buffer));
        const payload = FeedResponse.toObject(decoded, { longs: Number, enums: String, defaults: true });

        const ticks = extractTicks(payload);
        if (ticks.length === 0) return;

        const normalizedTicks = [];

        for (const tick of ticks) {
          const symbol =
            state.keyToSymbol.get(tick.instrumentKey) || (await resolveSymbolFromKey(tick.instrumentKey));
          if (!symbol) continue;

          const normalized = { ...tick, symbol };
          state.latestQuotes.set(symbol, normalized);
          normalizedTicks.push(normalized);
          syncStockToDb(normalized, symbol);
        }

        if (state.io && normalizedTicks.length > 0) {
          state.io.emit("market:tick", { ticks: normalizedTicks });
        }

        const now = Date.now();
        if (normalizedTicks.length > 0 && now - state.lastTickLog > 30000) {
          state.lastTickLog = now;
          const sample = normalizedTicks[0];
          console.log(`[marketDataFeed] Received ${normalizedTicks.length} ticks (${sample.symbol} @ ${sample.price})`);
        }
      } catch (error) {
        console.error("[marketDataFeed] Message decode error:", error.message);
      }
    });

    ws.on("close", () => {
      state.connected = false;
      state.ws = null;
      console.log("[marketDataFeed] Connection closed, reconnecting...");
      startYahooFallback();
      scheduleReconnect();
    });

    ws.on("error", (error) => {
      console.error("[marketDataFeed] WebSocket error:", error.message);
      try {
        ws.close();
      } catch {}
    });

    state.ws = ws;
  } catch (error) {
    console.error("[marketDataFeed] Connection failed:", error.message);
    startYahooFallback();
    scheduleReconnect();
  }
}

//scheduleReconnect() — Connection toot jaye to exponential backoff (1s → 2s → 4s...30s max) se reconnect try karta hai
function scheduleReconnect() {
  if (!state.shouldRun || state.retryTimer) return;

  state.retryCount += 1;
  const delay = Math.min(1000 * 2 ** Math.min(state.retryCount, 5), 30000);

  console.log(`[marketDataFeed] Retrying in ${Math.round(delay / 1000)}s (attempt ${state.retryCount})`);
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null;
    connect();
  }, delay);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// subscribe(symbols) / unsubscribe(symbols) — Server.js se call hote hain jab client subscribe/unsubscribe karta hai
export const subscribe = async (symbols) => {
  const list = Array.isArray(symbols) ? symbols : [symbols];
  const newKeys = [];

  for (const symbol of list) {
    const key = await resolveInstrumentKey(symbol);
    if (key && !state.subscribedKeys.has(key)) {
      state.subscribedKeys.add(key);
      newKeys.push(key);
    }
  }

  if (newKeys.length > 0 && state.connected) sendSubscriptions();
};

export const unsubscribe = async (symbols) => {
  const list = Array.isArray(symbols) ? symbols : [symbols];
  const removedKeys = [];

  for (const symbol of list) {
    const key = await resolveInstrumentKey(symbol);
    if (key && state.subscribedKeys.delete(key)) removedKeys.push(key);
  }

  if (removedKeys.length > 0 && state.connected) sendUnsubscriptions(removedKeys);
};

//getLatestQuotes() — Latest cached quotes ka Map return karta hai
export const getLatestQuotes = () => state.latestQuotes;
export const isFeedRunning = () => state.connected;

//startMarketFeed(io) — Sab kuch initialize karta hai: popular symbols auto-subscribe karta hai, connection start karta hai
export const startMarketFeed = (io, { autoSubscribeStocks = true } = {}) => {
  state.io = io;
  state.shouldRun = true;

  loadProto().catch((error) => console.error("[marketDataFeed] Proto load failed:", error.message));

  if (autoSubscribeStocks) {
    (async () => {
      try {
        const synced = await Stock.find({ isActive: true, currentPrice: { $gt: 0 } })
          .select("symbol")
          .lean();

        const candidates = [...new Set([...POPULAR_SYMBOLS, ...synced.map((s) => s.symbol)])];

        for (const symbol of candidates) {
          const key = await resolveInstrumentKey(symbol);
          if (key) state.subscribedKeys.add(key);
        }

        console.log(`[marketDataFeed] Auto-subscribed to ${state.subscribedKeys.size} instruments`);
        if (state.connected) sendSubscriptions();
      } catch (error) {
        console.error("[marketDataFeed] Auto-subscribe failed:", error.message);
      }
    })();
  }

  connect();
  return { subscribe, unsubscribe, getLatestQuotes, isFeedRunning };
};