import WebSocket from "ws";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";
import Stock from "../models/Stock.js";
import { getAccessToken } from "./upstox.service.js";
import {
  getInstrumentKey,
  getSymbolFromKey,
  INDEX_KEYS,
} from "./upstoxInstruments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_FILE = path.join(__dirname, "MarketDataFeedV3.proto");
const FEED_RESPONSE_TYPE = "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse";

const UPSTOX_BASE_URL =
  process.env.UPSTOX_API_BASE_URL?.replace(/\/+$/, "") || "https://api.upstox.com";

const FEED_AUTHORIZE_PATH = "/v3/feed/market-data-feed/authorize";

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
  latestQuotes: new Map(), // symbol -> tick
  lastDbSync: new Map(),   // symbol -> timestamp
  lastTickLog: 0,
  protoRoot: null,
  FeedResponse: null,
};

const DB_SYNC_INTERVAL_MS = 15000;

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

async function loadProto() {
  if (state.FeedResponse) return state.FeedResponse;

  const root = await protobuf.load(PROTO_FILE);
  state.protoRoot = root;
  state.FeedResponse = root.lookupType(FEED_RESPONSE_TYPE);
  return state.FeedResponse;
}

// ---------------------------------------------------------------------------
// Instrument key helpers
// ---------------------------------------------------------------------------

const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

async function resolveInstrumentKey(symbol) {
  const normalized = normalizeSymbol(symbol);

  if (INDEX_KEYS[normalized]) {
    state.keyToSymbol.set(INDEX_KEYS[normalized], normalized);
    return INDEX_KEYS[normalized];
  }

  const key = await getInstrumentKey(normalized);
  if (key) {
    state.keyToSymbol.set(key, normalized);
  }
  return key;
}

async function resolveSymbolFromKey(instrumentKey) {
  if (state.keyToSymbol.has(instrumentKey)) return state.keyToSymbol.get(instrumentKey);

  const symbol = await getSymbolFromKey(instrumentKey);
  if (symbol) state.keyToSymbol.set(instrumentKey, symbol);
  return symbol;
}

// ---------------------------------------------------------------------------
// Message decoding (protobuf -> plain ticks)
// ---------------------------------------------------------------------------

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
// Feed connection
// ---------------------------------------------------------------------------

function sendSubscriptions() {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN || state.subscribedKeys.size === 0) {
    return;
  }

  state.ws.send(
    Buffer.from(
      JSON.stringify({
        guid: `sub-${Date.now()}`,
        method: "sub",
        data: {
          mode: "full",
          instrumentKeys: Array.from(state.subscribedKeys),
        },
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

async function connect() {
  if (!state.shouldRun) return;

  try {
    const token = await getAccessToken();

    const authResponse = await fetch(`${UPSTOX_BASE_URL}${FEED_AUTHORIZE_PATH}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!authResponse.ok) {
      const body = await authResponse.text();
      throw new Error(`Feed authorize failed: ${authResponse.status} ${body}`);
    }

    const authJson = await authResponse.json();
    const socketUrl = authJson?.data?.authorizedRedirectUri;

    if (!socketUrl) {
      throw new Error("Feed authorize returned no socket URL");
    }

    const ws = new WebSocket(socketUrl, { followRedirects: true });

    ws.on("open", () => {
      console.log("[marketDataFeed] Connected to Upstox market feed");
      state.connected = true;
      state.retryCount = 0;
      sendSubscriptions();
    });

    ws.on("message", async (data) => {
      try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const FeedResponse = await loadProto();
        const decoded = FeedResponse.decode(new Uint8Array(buffer));
        const payload = FeedResponse.toObject(decoded, {
          longs: Number,
          enums: String,
          defaults: true,
        });

        const ticks = extractTicks(payload);
        if (ticks.length === 0) return;

        const normalizedTicks = [];

        for (const tick of ticks) {
          const symbol =
            state.keyToSymbol.get(tick.instrumentKey) ||
            (await resolveSymbolFromKey(tick.instrumentKey));
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
          console.log(
            `[marketDataFeed] Received ${normalizedTicks.length} ticks (${sample.symbol} @ ${sample.price})`
          );
        }
      } catch (error) {
        console.error("[marketDataFeed] Message decode error:", error.message);
      }
    });

    ws.on("close", () => {
      state.connected = false;
      state.ws = null;
      console.log("[marketDataFeed] Connection closed, reconnecting...");
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
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (!state.shouldRun) return;
  if (state.retryTimer) return;

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

  if (newKeys.length > 0 && state.connected) {
    sendSubscriptions();
  }
};

export const unsubscribe = async (symbols) => {
  const list = Array.isArray(symbols) ? symbols : [symbols];
  const removedKeys = [];

  for (const symbol of list) {
    const key = await resolveInstrumentKey(symbol);
    if (key && state.subscribedKeys.delete(key)) {
      removedKeys.push(key);
    }
  }

  if (removedKeys.length > 0 && state.connected) {
    sendUnsubscriptions(removedKeys);
  }
};

export const getLatestQuotes = () => state.latestQuotes;

export const isFeedRunning = () => state.connected;

export const startMarketFeed = (io, { autoSubscribeStocks = true } = {}) => {
  state.io = io;
  state.shouldRun = true;

  loadProto().catch((error) => {
    console.error("[marketDataFeed] Proto load failed:", error.message);
  });

  if (autoSubscribeStocks) {
    (async () => {
      try {
        const synced = await Stock.find({ isActive: true, currentPrice: { $gt: 0 } })
          .select("symbol")
          .lean();

        const candidates = [
          ...new Set([...POPULAR_SYMBOLS, ...synced.map((s) => s.symbol)]),
        ];

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
  return { subscribe, unsubscribe, getLatestQuotes, isFeedRunning: isFeedRunning };
};
