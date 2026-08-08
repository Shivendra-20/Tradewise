import { getInstrumentKey } from "./upstoxInstruments.js";

const UPSTOX_BASE_URL =
  process.env.UPSTOX_API_BASE_URL?.replace(/\/+$/, "") || "https://api.upstox.com";

const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY;

// ---------------------------------------------------------------------------
// Access token management
//
// Preferred: UPSTOX_ACCESS_TOKEN — set this to an Upstox "Analytics" token
// (read-only, valid 1 year, from Developer Apps -> Analytics tab) or a
// manually generated OAuth access token.
//
// Optional auto-refresh: if UPSTOX_REFRESH_TOKEN + UPSTOX_CLIENT_ID +
// UPSTOX_CLIENT_SECRET are present, the service refreshes the token
// automatically when it is about to expire (OAuth tokens expire daily).
// ---------------------------------------------------------------------------

let accessToken = process.env.UPSTOX_ACCESS_TOKEN || "";
let tokenExpiresAt = 0;
let tokenRefreshPromise = null;

const apiHeaders = (extra = {}) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  ...(UPSTOX_API_KEY ? { "x-api-key": UPSTOX_API_KEY } : {}),
  ...extra,
});

// Retry a fetch when the network is flaky (DNS drops, MITM timeouts, transient
// 5xx/403 from a filtering proxy). Only retries retryable conditions.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (url, { attempts = 3, backoffMs = 700, ...fetchOptions } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (response.ok) return response;

      // 4xx (except 408/429) are deterministic — don't retry them.
      if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < attempts) {
      await sleep(backoffMs * attempt);
    }
  }
  throw lastError || new Error(`Fetch failed after ${attempts} attempts`);
};

export const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;
  if (accessToken && !process.env.UPSTOX_REFRESH_TOKEN) return accessToken;

  if (!tokenRefreshPromise) {
    tokenRefreshPromise = (async () => {
      const refreshed = await refreshUpstoxToken();
      tokenRefreshPromise = null;
      return refreshed;
    })();
  }

  return tokenRefreshPromise;
};

export const refreshUpstoxToken = async () => {
  const { UPSTOX_REFRESH_TOKEN, UPSTOX_CLIENT_ID, UPSTOX_CLIENT_SECRET } = process.env;

  if (!UPSTOX_REFRESH_TOKEN || !UPSTOX_CLIENT_ID || !UPSTOX_CLIENT_SECRET) {
    if (!accessToken) {
      throw new Error("UPSTOX_ACCESS_TOKEN (or refresh-token credentials) is not configured");
    }
    return accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: UPSTOX_REFRESH_TOKEN,
    client_id: UPSTOX_CLIENT_ID,
    client_secret: UPSTOX_CLIENT_SECRET,
  });

  const response = await fetch(`${UPSTOX_BASE_URL}/v2/login/authorization/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstox token refresh failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  accessToken = data.access_token || accessToken;
  tokenExpiresAt = data.expires_in ? Date.now() + (Number(data.expires_in) - 60) * 1000 : Date.now() + 60 * 60 * 1000;

  console.log("[upstox] Access token refreshed");
  return accessToken;
};

// ---------------------------------------------------------------------------
// REST endpoints
// ---------------------------------------------------------------------------

export const fetchUpstoxQuote = async (symbol) => {
  const instrumentKey = await getInstrumentKey(symbol);
  if (!instrumentKey) {
    throw new Error(`No instrument key found for symbol "${symbol}"`);
  }

  const token = await getAccessToken();

  const url = `${UPSTOX_BASE_URL}/v2/market-quote/quotes?symbol=${encodeURIComponent(instrumentKey)}`;

  const response = await fetch(url, { headers: apiHeaders({ Authorization: `Bearer ${token}` }) });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstox quote fetch failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const payload = json?.data?.[instrumentKey] ?? json?.data?.[Object.keys(json?.data || {})[0]];

  if (!payload) {
    throw new Error(`Upstox returned no quote data for "${symbol}"`);
  }

  return normalizeQuote(payload, instrumentKey);
};

// Batch quotes for up to 500 symbols per call (used to live-enrich market lists)
export const fetchUpstoxBatchQuotes = async (symbols) => {
  const list = Array.isArray(symbols) ? symbols.filter(Boolean) : [];
  if (list.length === 0) return {};

  const token = await getAccessToken();

  const chunks = [];
  for (let i = 0; i < list.length; i += 500) {
    chunks.push(list.slice(i, i + 500));
  }

  const result = {};

  for (const chunk of chunks) {
    const keys = [];
    const symbolByKey = new Map();

    for (const symbol of chunk) {
      const key = await getInstrumentKey(symbol);
      if (!key) continue;
      symbolByKey.set(key, symbol);
      keys.push(key);
    }

    if (keys.length === 0) continue;

    const params = new URLSearchParams();
    for (const key of keys) params.append("symbol", key);

    const response = await fetchWithRetry(`${UPSTOX_BASE_URL}/v2/market-quote/quotes?${params.toString()}`, {
      headers: apiHeaders({ Authorization: `Bearer ${token}` }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upstox batch quote failed: ${response.status} ${body}`);
    }

    const json = await response.json();

    for (const value of Object.values(json?.data || {})) {
      const key = value?.instrument_token;
      const symbol = symbolByKey.get(key) || value?.symbol;
      if (!symbol) continue;

      const price = num(value?.last_price);
      const change = num(value?.net_change);
      const close = price != null && change != null ? price - change : null;

      result[symbol] = {
        symbol,
        instrumentKey: key,
        price,
        change,
        changePercent: close > 0 ? (change / close) * 100 : null,
        volume: num(value?.volume),
        open: num(value?.ohlc?.open),
        high: num(value?.ohlc?.high),
        low: num(value?.ohlc?.low),
        close,
        timestamp: value?.timestamp ?? null,
      };
    }
  }

  return result;
};

export const fetchUpstoxHistory = async ({
  symbol,
  interval = "day",
  fromDate,
  toDate,
}) => {
  const instrumentKey = await getInstrumentKey(symbol);
  if (!instrumentKey) {
    throw new Error(`No instrument key found for symbol "${symbol}"`);
  }

  const token = await getAccessToken();

  const dateTo = toDate || new Date().toISOString().split("T")[0];
  const dateFrom = fromDate || dateTo;

  const url = `${UPSTOX_BASE_URL}/v2/historical-candle/${encodeURIComponent(
    instrumentKey
  )}/${interval}/${dateTo}/${dateFrom}`;

  const response = await fetchWithRetry(url, {
    headers: apiHeaders({ Authorization: `Bearer ${token}` }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstox history fetch failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const candles = json?.data?.candles;

  if (!Array.isArray(candles)) {
    throw new Error(`Upstox returned no candles for "${symbol}"`);
  }

  return {
    symbol,
    instrumentKey,
    candles: candles
      .map(([time, open, high, low, close, volume]) => ({
        time: Math.floor(new Date(time).getTime() / 1000),
        open,
        high,
        low,
        close,
        volume,
      }))
      .sort((a, b) => a.time - b.time),
  };
};

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeQuote = (payload, instrumentKey) => {
  const price = num(payload?.last_price ?? payload?.ltp ?? payload?.price);
  const close = num(payload?.close_price ?? payload?.cp ?? payload?.close);
  const change = num(payload?.change ?? payload?.price_change);
  const changePercent = num(payload?.change_percent ?? payload?.changePercent);
  const volume = num(payload?.volume);

  return {
    symbol: payload?.symbol?.split("|")[1] ?? payload?.symbol ?? instrumentKey,
    instrumentKey,
    price,
    change,
    changePercent,
    volume,
    open: num(payload?.ohlc?.open),
    high: num(payload?.ohlc?.high),
    low: num(payload?.ohlc?.low),
    close,
    previousClose: close,
    timestamp: payload?.timestamp ?? new Date().toISOString(),
    raw: payload,
  };
};
