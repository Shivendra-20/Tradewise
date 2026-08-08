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

function loadFromCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      instruments = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      loaded = true;
      console.log(`[upstoxInstruments] Loaded ${instruments.length} instruments from cache`);
      return true;
    }
  } catch (error) {
    console.error("[upstoxInstruments] Cache load failed:", error.message);
  }
  return false;
}

async function downloadInstruments() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const response = await fetch(EXCHANGE_FILE_URL);
  if (!response.ok) {
    throw new Error(`Instrument master download failed: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const json = zlib.gunzipSync(buffer).toString("utf8");
  instruments = JSON.parse(json);

  fs.writeFileSync(CACHE_FILE, JSON.stringify(instruments));
  console.log(`[upstoxInstruments] Downloaded ${instruments.length} instruments`);
}

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
        if (instruments.length === 0) {
          throw error;
        }
      }
      return instruments;
    })();
  }

  return loadPromise;
};

const normalizeSymbol = (symbol) => String(symbol || "").trim().toUpperCase();

// Indices are not part of the NSE.json.gz instrument master, so map them here.
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

// Map a trading symbol to an Upstox instrument key, e.g. RELIANCE -> NSE_EQ|INE002A01018
export const getInstrumentKey = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  if (INDEX_KEYS[normalized]) return INDEX_KEYS[normalized];

  const list = await getInstruments();
  const match = list.find(
    (i) =>
      i.segment === "NSE_EQ" &&
      (String(i.trading_symbol).toUpperCase() === normalized ||
        String(i.asset_symbol).toUpperCase() === normalized)
  );

  return match?.instrument_key || null;
};

export const getInstrumentDetails = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  if (INDEX_KEYS[normalized]) {
    const key = INDEX_KEYS[normalized];
    const name = key.split("|")[1] || normalized;
    return {
      instrumentKey: key,
      name,
      symbol: normalized,
      exchange: key.startsWith("NSE") ? "NSE" : "BSE",
      sector: "Index",
    };
  }

  const list = await getInstruments();
  const match = list.find(
    (i) =>
      i.segment === "NSE_EQ" &&
      (String(i.trading_symbol).toUpperCase() === normalized ||
        String(i.asset_symbol).toUpperCase() === normalized)
  );

  if (!match) return null;

  return {
    instrumentKey: match.instrument_key,
    name: match.name,
    symbol: match.trading_symbol,
    exchange: match.exchange,
    sector: match.segment,
  };
};

// Reverse map: instrument key -> trading symbol
export const getSymbolFromKey = async (instrumentKey) => {
  const list = await getInstruments();
  const match = list.find((i) => i.instrument_key === instrumentKey);
  return match?.trading_symbol || match?.name || null;
};
