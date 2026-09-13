import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCHANGE_FILE_URL = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";
const CACHE_DIR = path.join(__dirname, "..", ".upstox-cache");
const CACHE_FILE = path.join(CACHE_DIR, "instruments.json");

let instruments = [];
let loaded = false;
let loadPromise = null;

//loadFromCache() — Disk pe pehle se saved .upstox-cache/instruments.json file check karta hai. 
// Mil gaya to memory mein load kar leta hai (fresh download avoid karne ke liye).
function loadFromCache() {
  if (!fs.existsSync(CACHE_FILE)) return false;
  try {
    instruments = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    loaded = true;
    console.log(`[upstoxInstruments] Loaded ${instruments.length} instruments from cache`);
    return true;
  } catch (error) {
    console.error("[upstoxInstruments] Cache load failed:", error.message);
    return false;
  }
}

//downloadInstruments() — Upstox ke server se gzip-compressed NSE instruments list download karta hai, 
// unzip karta hai (zlib.gunzipSync), aur disk pe cache kar deta hai future ke liye.
async function downloadInstruments() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const response = await fetch(EXCHANGE_FILE_URL);
  if (!response.ok) throw new Error(`Instrument master download failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  instruments = JSON.parse(zlib.gunzipSync(buffer).toString("utf8"));

  fs.writeFileSync(CACHE_FILE, JSON.stringify(instruments));
  console.log(`[upstoxInstruments] Downloaded ${instruments.length} instruments`);
}

//getInstruments(force) — Ye main entry point hai: pehle cache try karta hai, nahi mila to download karta hai. 
// oadPromise — agar ek saath multiple calls aa jaayein (server start hote hi), sabko ek hi download/load milega, 
// duplicate download nahi hoga.
export const getInstruments = async (force = false) => {
  if (loaded && !force) return instruments;

  if (!loadPromise) {
    loadPromise = (async () => {
      if (!force && loadFromCache()) return instruments;

      try {
        await downloadInstruments();
        loaded = true;
      } catch (error) {
        console.error("[upstoxInstruments] Download failed:", error.message);
        if (instruments.length === 0) throw error;
      }
      return instruments;
    })();
  }

  return loadPromise;
};

export const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

// Indices are not part of the NSE.json.gz instrument master, so map them here.
// INDEX_KEYS — Indices (NIFTY, SENSEX, etc) NSE ki instrument file mein nahi hote, isliye manually map kiye gaye hain.
export const INDEX_KEYS = {
  NIFTY50: "NSE_INDEX|Nifty 50",
  NIFTY: "NSE_INDEX|Nifty 50",
  NIFTYBANK: "NSE_INDEX|Nifty Bank",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
  NIFTYFIN: "NSE_INDEX|Nifty Fin Service",
  FINNIFTY: "NSE_INDEX|Nifty Fin Service",
  "NIFTY FIN SERVICE": "NSE_INDEX|Nifty Fin Service",
  SENSEX: "BSE_INDEX|SENSEX",
  MIDCPNIFTY: "NSE_INDEX|Nifty Midcap Select",
  BANKEX: "BSE_INDEX|BANKEX",
};

// Shared lookup used by both getInstrumentKey and getInstrumentDetails.
async function findInstrument(normalized) {
  const list = await getInstruments();
  return list.find(
    (i) =>
      i.segment === "NSE_EQ" &&
    (String(i.trading_symbol).toUpperCase() === normalized ||
    String(i.asset_symbol).toUpperCase() === normalized)
  );
}

//getInstrumentKey(symbol) — Symbol se instrument key nikalta hai (e.g. "RELIANCE" → "NSE_EQ|INE002A01018"). 
// Pehle indices check karta hai (INDEX_KEYS mein hardcoded), fir poori list mein linear search karta hai.
// OR (IN English) - Map a trading symbol to an Upstox instrument key, e.g. RELIANCE -> NSE_EQ|INE002A01018
export const getInstrumentKey = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  if (INDEX_KEYS[normalized]) return INDEX_KEYS[normalized];

  const match = await findInstrument(normalized);
  return match?.instrument_key || null;
};

// getInstrumentDetails(symbol) — Sirf key nahi, poori details deta hai — naam, exchange, sector waghera. 
// Same logic hai but zyada fields return karta hai.
export const getInstrumentDetails = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  if (INDEX_KEYS[normalized]) {
    const key = INDEX_KEYS[normalized];
    return {
      instrumentKey: key,
      name: key.split("|")[1] || normalized,
      symbol: normalized,
      exchange: key.startsWith("NSE") ? "NSE" : "BSE",
      sector: "Index",
    };
  }

  const match = await findInstrument(normalized);
  if (!match) return null;

  return {
    instrumentKey: match.instrument_key,
    name: match.name,
    symbol: match.trading_symbol,
    exchange: match.exchange,
    sector: match.segment,
  };
};


//getSymbolFromKey(instrumentKey) — Reverse lookup: key se wapas symbol nikalta hai 
// (jab WebSocket se tick aaye with key, symbol pata karne ke liye).
// Reverse map: instrument key -> trading symbol  
export const getSymbolFromKey = async (instrumentKey) => {
  const list = await getInstruments();
  const match = list.find((i) => i.instrument_key === instrumentKey);
  return match?.trading_symbol || match?.name || null;
};