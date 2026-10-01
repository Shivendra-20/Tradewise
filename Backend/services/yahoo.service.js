import axios from "axios";

// Yahoo Finance quoteSummary API — sirf fundamentals (market cap, P/E, EPS)
// ke liye. Upstox market-data API ye data provide nahi karta, isliye ye
// secondary source sirf company financials ke liye use hota hai.

const YAHOO_QUOTE_SUMMARY = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const AUTH_TTL_MS = 6 * 60 * 60 * 1000;  // time in ms it is 6hr

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"; //Ye server ko batata hai ki request kis type ke client/browser se aa rahi hai.

// Upstox symbol -> Yahoo symbol. Equities map to NSE via ".NS" suffix.
const INDEX_MAP = {
  NIFTY50: "^NSEI",
  SENSEX: "^BSESN",
  NIFTYBANK: "^NSEBANK",
  NIFTYFIN: "^CNXFIN",
};

const toYahooSymbol = (symbol) => {
  const upper = String(symbol || "").toUpperCase().trim();
  return INDEX_MAP[upper] || `${upper}.NS`;
};

// ---------------------------------------------------------------------------
// Auth (cookie + crumb) — Yahoo ka quoteSummary endpoint bina session cookie
// aur crumb token ke anonymous requests block kar deta hai.
// ---------------------------------------------------------------------------

let yahooAuth = null;
let yahooAuthPromise = null;

//getYahooAuth() — fc.yahoo.com se session cookie, phir us cookie se crumb token
// leta hai. Dono ko 6 ghante cache karta hai. yahooAuthPromise guard duplicate
// handshake rokti hai (ek saath multiple requests pe ek hi auth).
async function getYahooAuth() {
  if (yahooAuth && Date.now() - yahooAuth.at < AUTH_TTL_MS) return yahooAuth;

  if (!yahooAuthPromise) {
    yahooAuthPromise = (async () => {
      const cookieResp = await axios.get("https://fc.yahoo.com", {
        maxRedirects: 0,
        headers: { "User-Agent": UA },
        validateStatus: () => true,
      });

      const setCookies = cookieResp.headers["set-cookie"]?.join("; ") || "";
      const cookie = (setCookies.match(/[A-Za-z0-9]+=[^;]+/g) || []).join("; ");
      if (!cookie) throw new Error(`Yahoo auth cookie not available: ${setCookies}`);

      const crumbResp = await axios.get("https://query1.finance.yahoo.com/v1/test/getcrumb", {
        headers: { "User-Agent": UA, Cookie: cookie },
        validateStatus: () => true,
      });
      if (crumbResp.status < 200 || crumbResp.status >= 300) {
        throw new Error(`Yahoo crumb fetch failed: ${crumbResp.status}`);
      }

      const crumb = String(crumbResp.data).trim();
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

// fetchYahooFundamentals({symbol}) — Market cap, P/E ratio, EPS, book value,
// dividend yield waghera laata hai. ROE khud calculate karta hai (EPS / book
// value) kyunki Yahoo reliably nahi deta. ROCE Yahoo se nahi milta, null rehta hai.
export const fetchYahooFundamentals = async ({ symbol }) => {
  const yahooSymbol = toYahooSymbol(symbol);
  const { cookie, crumb } = await getYahooAuth();

  const modules = "price,summaryDetail,defaultKeyStatistics";
  const url = `${YAHOO_QUOTE_SUMMARY}/${encodeURIComponent(yahooSymbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

  const res = await axios.get(url, {
    headers: { Accept: "application/json", "User-Agent": UA, Cookie: cookie },
    validateStatus: () => true,
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Yahoo fundamentals fetch failed: ${res.status}`);
  }

  const result = res.data?.quoteSummary?.result?.[0];
  if (!result) throw new Error(`Yahoo returned no fundamentals for "${symbol}"`);

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