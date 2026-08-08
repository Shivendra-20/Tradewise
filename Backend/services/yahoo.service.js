// Yahoo Finance chart API fallback for historical candles.
// Used when the Upstox REST API is blocked/unreachable so charts keep working.

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Upstox symbol -> Yahoo symbol. Equities map to NSE via ".NS" suffix.
const INDEX_MAP = {
  NIFTY50: "^NSEI",
  SENSEX: "^BSESN",
  NIFTYBANK: "^NSEBANK",
  NIFTYFIN: "^CNXFIN",
};

const RANGE_MAP = {
  "1minute": { interval: "1m", range: "5d" },
  "30minute": { interval: "30m", range: "1mo" },
  day: { interval: "1d", range: "3mo" },
  week: { interval: "1wk", range: "2y" },
  month: { interval: "1mo", range: "max" },
};

const toYahooSymbol = (symbol) => {
  const upper = String(symbol || "").toUpperCase().trim();
  if (INDEX_MAP[upper]) return INDEX_MAP[upper];
  return `${upper}.NS`;
};

export const fetchYahooHistory = async ({ symbol, interval = "day" }) => {
  const yahooInterval = RANGE_MAP[interval];
  if (!yahooInterval) {
    throw new Error(`Unsupported Yahoo interval "${interval}"`);
  }

  const yahooSymbol = toYahooSymbol(symbol);
  const params = new URLSearchParams({
    interval: yahooInterval.interval,
    range: yahooInterval.range,
    events: "history",
  });

  const url = `${YAHOO_CHART}/${encodeURIComponent(yahooSymbol)}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Yahoo history fetch failed: ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  const times = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!Array.isArray(times) || !quote) {
    throw new Error(`Yahoo returned no candles for "${symbol}"`);
  }

  const candles = [];
  for (let i = 0; i < times.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    if (open == null || high == null || low == null || close == null) continue;

    candles.push({
      time: times[i],
      open,
      high,
      low,
      close,
      volume: quote.volume?.[i] ?? 0,
    });
  }

  return {
    symbol,
    instrumentKey: yahooSymbol,
    source: "yahoo",
    candles,
  };
};

// Real-time quote snapshot from the chart endpoint meta (works even when the
// Upstox REST API is blocked). Includes day range, 52-week range and volume.
export const fetchYahooMeta = async ({ symbol }) => {
  const yahooSymbol = toYahooSymbol(symbol);

  const params = new URLSearchParams({
    interval: "1d",
    range: "5d",
    events: "history",
  });

  const url = `${YAHOO_CHART}/${encodeURIComponent(yahooSymbol)}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Yahoo quote fetch failed: ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const times = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!meta) {
    throw new Error(`Yahoo returned no quote for "${symbol}"`);
  }

  // Previous close = last completed daily candle (Yahoo often omits it in meta).
  let previousClose = meta.previousClose ?? null;
  if (previousClose == null && Array.isArray(times) && quote) {
    const closes = [];
    for (let i = 0; i < times.length; i++) {
      if (quote.close?.[i] != null) closes.push(quote.close[i]);
    }
    previousClose = closes[closes.length - 2] ?? closes[closes.length - 1] ?? null;
  }

  const price = meta.regularMarketPrice ?? null;
  const change = price != null && previousClose ? price - previousClose : null;
  const changePercent =
    price != null && previousClose ? (change / previousClose) * 100 : null;

  return {
    symbol,
    yahooSymbol,
    source: "yahoo",
    name: meta.longName ?? meta.shortName ?? symbol,
    price,
    change,
    changePercent,
    previousClose,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    volume: meta.regularMarketVolume ?? null,
    weekHigh52: meta.fiftyTwoWeekHigh ?? null,
    weekLow52: meta.fiftyTwoWeekLow ?? null,
    currency: meta.currency ?? null,
  };
};

// ---------------------------------------------------------------------------
// Fundamentals (market cap, P/E, EPS, book value, ...) from the quoteSummary
// endpoint. Unlike the chart API this one requires a session cookie + crumb.
// Both are fetched once and reused for all symbols (crumb stays valid for a
// long time, we re-handshake every 6 hours just to be safe).
// ---------------------------------------------------------------------------

const YAHOO_QUOTE_SUMMARY = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const AUTH_TTL_MS = 6 * 60 * 60 * 1000;

let yahooAuth = null;
let yahooAuthPromise = null;

async function getYahooAuth() {
  if (yahooAuth && Date.now() - yahooAuth.at < AUTH_TTL_MS) {
    return yahooAuth;
  }

  if (!yahooAuthPromise) {
    yahooAuthPromise = (async () => {
      const cookieResp = await fetch("https://fc.yahoo.com", {
        redirect: "manual",
        headers: { "User-Agent": UA },
      });
      const setCookies = cookieResp.headers.get("set-cookie") || "";
      const cookie = (setCookies.match(/[A-Za-z0-9]+=[^;]+/g) || []).join("; ");
      if (!cookie) {
        throw new Error(`Yahoo auth cookie not available: ${setCookies}`);
      }

      const crumbResp = await fetch(
        "https://query1.finance.yahoo.com/v1/test/getcrumb",
        { headers: { "User-Agent": UA, Cookie: cookie } }
      );
      if (!crumbResp.ok) {
        throw new Error(`Yahoo crumb fetch failed: ${crumbResp.status}`);
      }
      const crumb = (await crumbResp.text()).trim();
      if (!crumb) throw new Error("Yahoo crumb response was empty");

      yahooAuth = { cookie, crumb, at: Date.now() };
      return yahooAuth;
    })();
  }

  try {
    return await yahooAuthPromise;
  } finally {
    yahooAuthPromise = null;
  }
}

// Fundamental metrics for a stock. ROE is not exposed reliably by Yahoo, so it
// is derived as trailing EPS / book value per share (mathematically equivalent
// to net income / equity). ROCE is not available and stays null.
export const fetchYahooFundamentals = async ({ symbol }) => {
  const yahooSymbol = toYahooSymbol(symbol);
  const { cookie, crumb } = await getYahooAuth();

  const modules = "price,summaryDetail,defaultKeyStatistics";
  const url = `${YAHOO_QUOTE_SUMMARY}/${encodeURIComponent(yahooSymbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      Cookie: cookie,
    },
  });
  if (!response.ok) {
    throw new Error(`Yahoo fundamentals fetch failed: ${response.status}`);
  }

  const json = await response.json();
  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo returned no fundamentals for "${symbol}"`);
  }

  const sd = result.summaryDetail || {};
  const ks = result.defaultKeyStatistics || {};
  const price = result.price?.regularMarketPrice?.raw ?? null;
  const bookValue = ks.bookValue?.raw ?? sd.bookValue?.raw ?? null;
  const eps = ks.trailingEps?.raw ?? null;
  const roe = ks.returnOnEquity?.raw ?? (eps && bookValue ? eps / bookValue : null);

  return {
    symbol,
    yahooSymbol,
    source: "yahoo",
    marketCap: sd.marketCap?.raw ?? null,
    peRatio: sd.trailingPE?.raw ?? null,
    priceToBook: price && bookValue ? price / bookValue : null,
    dividendYield: sd.dividendYield?.raw ?? null,
    eps,
    roe,
    bookValue,
    roce: null,
  };
};
