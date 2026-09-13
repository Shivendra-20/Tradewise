import axios from "axios";
import { getInstrumentKey } from "./upstoxInstruments.js";

const UPSTOX_BASE_URL = process.env.UPSTOX_API_BASE_URL?.replace(/\/+$/, "") || "https://api.upstox.com";
const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY;

let accessToken = process.env.UPSTOX_ACCESS_TOKEN || "";
let tokenExpiresAt = 0;
let tokenRefreshPromise = null;

//apiHeaders() — Har request ke liye headers banata hai (token + api key auto attach kar deta hai)
const apiHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  ...(UPSTOX_API_KEY ? { "x-api-key": UPSTOX_API_KEY } : {}),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetchWithRetry(url, options) — Kisi bhi URL ko call karta hai,
//  agar fail ho (5xx/408/429) to 3 baar tak retry karta hai backoff ke saath (700ms, 1400ms...). 
// 4xx errors (jaise 404) pe retry nahi karta — kyunki wo dobara try karne se sahi nahi hoga.
export const fetchWithRetry = async (url, { attempts = 3, backoffMs = 700, ...opts } = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await axios.get(url, { ...opts, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) return res;
      if (res.status >= 400 && res.status < 500 && ![408, 429].includes(res.status)) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < attempts) await sleep(backoffMs * attempt);
  }

  throw lastError;
};



//getAccessToken() — Check karta hai token valid hai ya nahi.
//  Agar static token hai (no refresh token env) → wahi return. 
// Agar expire ho gaya → refreshUpstoxToken() call karta hai. 
// Duplicate refresh calls rokta hai tokenRefreshPromise se
export const getAccessToken = async () => {
  if (accessToken && (Date.now() < tokenExpiresAt || !process.env.UPSTOX_REFRESH_TOKEN)) {
    return accessToken;
  }

  if (!tokenRefreshPromise) {
    tokenRefreshPromise = refreshUpstoxToken();
    try {
      return await tokenRefreshPromise;
    } finally {
      tokenRefreshPromise = null;
    }
  }

  return tokenRefreshPromise;
};

//refreshUpstoxToken() — Upstox ke OAuth endpoint se naya access token leta hai (refresh token use karke). 
// Agar refresh credentials configure nahi hain, purana static token hi return kar deta hai.
export const refreshUpstoxToken = async () => {
  const { UPSTOX_REFRESH_TOKEN, UPSTOX_CLIENT_ID, UPSTOX_CLIENT_SECRET } = process.env;

  if (!UPSTOX_REFRESH_TOKEN || !UPSTOX_CLIENT_ID || !UPSTOX_CLIENT_SECRET) {
    if (!accessToken) throw new Error("UPSTOX_ACCESS_TOKEN (or refresh-token credentials) missing");
    return accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: UPSTOX_REFRESH_TOKEN,
    client_id: UPSTOX_CLIENT_ID,
    client_secret: UPSTOX_CLIENT_SECRET,
  });

  const res = await axios.post(`${UPSTOX_BASE_URL}/v2/login/authorization/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upstox token refresh failed: ${res.status} ${JSON.stringify(res.data)}`);
  }

  accessToken = res.data.access_token || accessToken;
  tokenExpiresAt = Date.now() + ((res.data.expires_in ?? 3600) - 60) * 1000;
  return accessToken;
};

//num(value) — Kisi bhi value ko safe number mein convert karta hai; agar invalid ho to null return karta hai (crash nahi hota)
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

//normalizeQuote(payload, instrumentKey) — Upstox ka messy/inconsistent raw response leke ek clean,
//  predictable shape mein convert karta hai 
// — taaki poore app mein hamesha same format mile (price, change, volume, etc consistent naam se)
const normalizeQuote = (payload, instrumentKey) => {
  const price = num(payload?.last_price ?? payload?.ltp ?? payload?.price);
  const close = num(payload?.close_price ?? payload?.cp ?? payload?.close);
  return {
    symbol: payload?.symbol?.split("|")[1] ?? payload?.symbol ?? instrumentKey,
    instrumentKey,
    price,
    change: num(payload?.change ?? payload?.price_change),
    changePercent: num(payload?.change_percent ?? payload?.changePercent),
    volume: num(payload?.volume),
    open: num(payload?.ohlc?.open),
    high: num(payload?.ohlc?.high),
    low: num(payload?.ohlc?.low),
    close,
    previousClose: close,
    timestamp: payload?.timestamp ?? new Date().toISOString(),
    raw: payload,
  };
};


//fetchUpstoxQuote(symbol) — Ek stock ka current live price/data laata hai (e.g. "RELIANCE" → price, change, volume etc). 
// Pehle symbol ko instrument key mein convert karta hai, fir API call karta hai.
export const fetchUpstoxQuote = async (symbol) => { 
  const instrumentKey = await getInstrumentKey(symbol);
  if (!instrumentKey) throw new Error(`No instrument key for "${symbol}"`);

  await getAccessToken();
  const url = `${UPSTOX_BASE_URL}/v2/market-quote/quotes?symbol=${encodeURIComponent(instrumentKey)}`;
  const res = await fetchWithRetry(url, { headers: apiHeaders() });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upstox quote fetch failed: ${res.status} ${JSON.stringify(res.data)}`);
  }

  const payload = res.data?.data?.[instrumentKey] ?? res.data?.data?.[Object.keys(res.data?.data || {})[0]];
  if (!payload) throw new Error(`Upstox returned no quote for "${symbol}"`);
  return normalizeQuote(payload, instrumentKey);
};

//fetchUpstoxBatchQuotes(symbols) — Ek saath multiple stocks (500 tak per call) ka price laata hai
// — jab poori market list dikhani ho to ek-ek quote fetch karne se better hai.
export const fetchUpstoxBatchQuotes = async (symbols) => {  
  const list = (Array.isArray(symbols) ? symbols : []).filter(Boolean);
  if (!list.length) return {};

  await getAccessToken();
  const result = {};

  for (let i = 0; i < list.length; i += 500) {
    const chunk = list.slice(i, i + 500);
    const symbolByKey = new Map();
    const params = new URLSearchParams();

    for (const symbol of chunk) {
      const key = await getInstrumentKey(symbol);
      if (!key) continue;
      symbolByKey.set(key, symbol);
      params.append("symbol", key);
    }
    if (![...params].length) continue;

    const res = await fetchWithRetry(`${UPSTOX_BASE_URL}/v2/market-quote/quotes?${params}`, {
      headers: apiHeaders(),
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Upstox batch quote failed: ${res.status} ${JSON.stringify(res.data)}`);
    }

    for (const v of Object.values(res.data?.data || {})) {
      const symbol = symbolByKey.get(v?.instrument_token) || v?.symbol;
      if (!symbol) continue;
      const price = num(v?.last_price);
      const change = num(v?.net_change);
      const close = price != null && change != null ? price - change : null;
      result[symbol] = {
        symbol,
        instrumentKey: v.instrument_token,
        price,
        change,
        changePercent: close > 0 ? (change / close) * 100 : null,
        volume: num(v?.volume),
        open: num(v?.ohlc?.open),
        high: num(v?.ohlc?.high),
        low: num(v?.ohlc?.low),
        close,
        timestamp: v?.timestamp ?? null,
      };
    }
  }
  return result;
};


//fetchUpstoxHistory({symbol, interval, fromDate, toDate}) 
// — Kisi stock ka historical candle data (OHLC) laata hai chart banane ke liye (e.g. pichle 7 din ka 1-minute data).
export const fetchUpstoxHistory = async ({ symbol, interval = "day", fromDate, toDate }) => {  
  const instrumentKey = await getInstrumentKey(symbol);
  if (!instrumentKey) throw new Error(`No instrument key for "${symbol}"`);

  await getAccessToken();
  const dateTo = toDate || new Date().toISOString().split("T")[0];
  const dateFrom = fromDate || dateTo;

  const url = `${UPSTOX_BASE_URL}/v2/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${dateTo}/${dateFrom}`;
  const res = await fetchWithRetry(url, { headers: apiHeaders() });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upstox history fetch failed: ${res.status} ${JSON.stringify(res.data)}`);
  }

  const candles = res.data?.data?.candles;
  if (!Array.isArray(candles)) throw new Error(`Upstox returned no candles for "${symbol}"`);

  return {
    symbol,
    instrumentKey,
    candles: candles
      .map(([time, open, high, low, close, volume]) => ({
        time: Math.floor(new Date(time).getTime() / 1000),
        open, high, low, close, volume,
      }))
      .sort((a, b) => a.time - b.time),
  };
};