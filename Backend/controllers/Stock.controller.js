import Stock from "../models/Stock.js";
import StockHistory from "../models/StockHistory.js";
import { fetchUpstoxQuote, fetchUpstoxHistory, fetchUpstoxBatchQuotes } from "../services/upstox.service.js";
import { fetchYahooHistory, fetchYahooMeta, fetchYahooFundamentals } from "../services/yahoo.service.js";
import { getInstrumentDetails } from "../services/upstoxInstruments.js";

// Stock controllers

const TIMEFRAME_MAP = {
  "1D": { interval: "1minute", days: 7 },
  "1W": { interval: "30minute", days: 30 },
  "1M": { interval: "day", days: 365 },
  "3M": { interval: "day", days: 365 },
  "1Y": { interval: "week", days: 730 },
  ALL: { interval: "month", days: 3650 },
  "1minute": { interval: "1minute", days: 7 },
  "30minute": { interval: "30minute", days: 30 },
  day: { interval: "day", days: 365 },
  week: { interval: "week", days: 730 },
  month: { interval: "month", days: 3650 },
};

export const getAllStocks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const live = req.query.live === "1" || req.query.live === "true";

    const filter = { isActive: true };

    const { search, exchange, sector, symbols, sort } = req.query;

    if (search && String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { symbol: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
      ];
    }

    if (exchange && exchange !== "All") {
      filter.exchange = String(exchange).trim();
    }

    if (sector && sector !== "All") {
      filter.sector = String(sector).trim();
    }

    if (symbols && String(symbols).trim()) {
      const list = String(symbols)
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (list.length > 0) {
        filter.symbol = { $in: list };
      }
    }

    const sortQuery =
      {
        "Market Cap": { marketCap: -1 },
        "Price ↑": { currentPrice: 1 },
        "Price ↓": { currentPrice: -1 },
        "% Change": { changePercent: -1 },
        Volume: { volume: -1 },
      }[sort] || { symbol: 1 };

    const [stocks, total] = await Promise.all([
      Stock.find(filter)
        .select(
          "_id symbol name currentPrice change changePercent volume dayHigh dayLow previousClose marketCap exchange sector"
        )
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Stock.countDocuments(filter),
    ]);

    // Live enrichment: fetch real-time quotes in one batched Upstox call
    if (live && stocks.length > 0) {
      try {
        const quotes = await fetchUpstoxBatchQuotes(stocks.map((s) => s.symbol));
        for (const stock of stocks) {
          const q = quotes[stock.symbol];
          if (!q) continue;
          stock.currentPrice = q.price ?? stock.currentPrice;
          stock.change = q.change ?? stock.change;
          stock.changePercent = q.changePercent ?? stock.changePercent;
          stock.volume = q.volume ?? stock.volume;
          stock.dayHigh = q.high ?? stock.dayHigh;
          stock.dayLow = q.low ?? stock.dayLow;
          stock.previousClose = q.close ?? stock.previousClose;
        }
      } catch (error) {
        console.error("[getAllStocks] live enrichment failed:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      stocks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStocks: total,
        limit,
      },
    });
  } catch (error) {
    console.error("[getAllStocks]", error);
    res.status(500).json({ success: false, message: "Failed to fetch stocks." });
  }
};

// Curated benchmark indices shown on the dashboard.
const INDICES = [
  { symbol: "NIFTY50", label: "NIFTY 50" },
  { symbol: "SENSEX", label: "SENSEX" },
  { symbol: "NIFTYBANK", label: "BANKNIFTY" },
  { symbol: "NIFTYFIN", label: "FINNIFTY" },
];

let indicesCache = null;
let indicesCacheAt = 0;
const INDICES_TTL_MS = 15000;

export const getIndicesQuotes = async (req, res) => {
  try {
    const now = Date.now();
    if (indicesCache && now - indicesCacheAt < INDICES_TTL_MS) {
      return res.status(200).json({ success: true, indices: indicesCache });
    }

    const settled = await Promise.allSettled(
      INDICES.map(async (idx) => {
        let quote = null;

        try {
          const upstox = await fetchUpstoxQuote(idx.symbol);
          if (upstox?.price) {
            quote = {
              price: upstox.price,
              change: upstox.change ?? 0,
              changePercent: upstox.changePercent ?? 0,
              source: "upstox",
            };
          }
        } catch {
          // Upstox blocked/unreachable — fall through to Yahoo below.
        }

        if (!quote) {
          const meta = await fetchYahooMeta({ symbol: idx.symbol });
          if (meta?.price) {
            quote = {
              price: meta.price,
              change: meta.change ?? 0,
              changePercent: meta.changePercent ?? 0,
              previousClose: meta.previousClose ?? null,
              source: "yahoo",
            };
          }
        }

        if (!quote) return null;
        return { symbol: idx.symbol, label: idx.label, ...quote };
      })
    );

    const indices = settled
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    if (indices.length > 0) {
      indicesCache = indices;
      indicesCacheAt = now;
    }

    return res.status(200).json({ success: true, indices });
  } catch (error) {
    console.error("[getIndicesQuotes]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch indices." });
  }
};

export const getStockSectors = async (req, res) => {
  try {
    const sectors = await Stock.distinct("sector", { isActive: true });
    return res.status(200).json({
      success: true,
      sectors: (sectors || []).filter((s) => s && String(s).trim()).sort(),
    });
  } catch (error) {
    console.error("[getStockSectors]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sectors." });
  }
};

export const searchStocks = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 1) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const stocks = await Stock.find({
      isActive: true,
      $or: [
        { symbol: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
      ],
    })
      .select("symbol name currentPrice marketCap exchange sector")
      .limit(50)
      .lean();

    res.status(200).json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    console.error("[searchStocks]", error);
    res.status(500).json({ success: false, message: "Search failed." });
  }
};

// Per-symbol Yahoo quote cache (real-time enrichment for stock pages).
const yahooDetailCache = new Map();
const YAHOO_CACHE_TTL_MS = 120000;

// Fundamentals change slowly, so cache them much longer than the quote meta.
const yahooFundamentalsCache = new Map();
const YAHOO_FUND_TTL_MS = 6 * 60 * 60 * 1000;

export const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol?.trim().toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, message: "Stock symbol is required" });

    let stock = await Stock.findOne({ symbol, isActive: true }).lean();

    // Symbol not in DB yet: synthesize from Upstox instruments + live quote and upsert it
    if (!stock) {
      const details = await getInstrumentDetails(symbol);
      if (!details) {
        return res.status(404).json({ success: false, message: `Stock "${symbol}" not found` });
      }

      let price = 0;
      let change = 0;
      let changePercent = 0;
      let volume = 0;

      try {
        const quote = await fetchUpstoxQuote(symbol);
        price = quote.price ?? 0;
        change = quote.change ?? 0;
        changePercent = quote.changePercent ?? 0;
        volume = quote.volume ?? 0;
      } catch (err) {
        console.error("[getStockBySymbol] quote fetch failed for", symbol, err.message);
      }

      const doc = {
        symbol: details.symbol || symbol,
        name: details.name || symbol,
        sector: "Other",
        exchange: details.exchange || "NSE",
        instrumentKey: details.instrumentKey || "",
        currentPrice: price,
        previousClose: price > 0 ? price - change : 0,
        change,
        changePercent,
        volume,
        marketCap: 0,
        isActive: true,
      };

      await Stock.updateOne({ symbol: doc.symbol }, { $set: doc }, { upsert: true });
      stock = { ...doc, _id: "pending" };
    }

    // Enrich with a real per-symbol quote snapshot (Yahoo fallback when Upstox
    // is blocked). Cached so frequent page views don't hammer the API.
    try {
      const cached = yahooDetailCache.get(symbol);
      let meta = cached && Date.now() - cached.at < YAHOO_CACHE_TTL_MS ? cached.meta : null;

      if (!meta) {
        const fresh = await fetchYahooMeta({ symbol });
        if (fresh?.price) {
          meta = fresh;
          yahooDetailCache.set(symbol, { meta: fresh, at: Date.now() });
        }
      }

      if (meta?.price) {
        stock = {
          ...stock,
          name: meta.name || stock.name,
          currentPrice: meta.price,
          previousClose: meta.previousClose ?? stock.previousClose,
          change: meta.change ?? stock.change,
          changePercent: meta.changePercent ?? stock.changePercent,
          dayHigh: meta.dayHigh ?? stock.dayHigh,
          dayLow: meta.dayLow ?? stock.dayLow,
          volume: meta.volume ?? stock.volume,
          weekHigh52: meta.weekHigh52 ?? stock.weekHigh52,
          weekLow52: meta.weekLow52 ?? stock.weekLow52,
        };

        if (stock._id && stock._id !== "pending") {
          Stock.updateOne(
            { symbol },
            {
              $set: {
                name: meta.name,
                currentPrice: meta.price,
                previousClose: meta.previousClose,
                change: meta.change,
                changePercent: meta.changePercent,
                dayHigh: meta.dayHigh,
                dayLow: meta.dayLow,
                volume: meta.volume,
                weekHigh52: meta.weekHigh52,
                weekLow52: meta.weekLow52,
              },
            }
          ).catch(() => {});
        }
      }
    } catch (error) {
      console.error("[getStockBySymbol] yahoo enrichment failed for", symbol, error.message);
    }

    // Enrich with fundamental metrics (market cap, P/E, EPS, ...) from Yahoo's
    // quoteSummary endpoint. Cached for 6 hours since fundamentals don't move
    // intraday.
    try {
      const cachedFund = yahooFundamentalsCache.get(symbol);
      let fund = cachedFund && Date.now() - cachedFund.at < YAHOO_FUND_TTL_MS ? cachedFund.fund : null;

      if (!fund) {
        const fresh = await fetchYahooFundamentals({ symbol });
        if (fresh?.marketCap != null || fresh?.peRatio != null) {
          fund = fresh;
          yahooFundamentalsCache.set(symbol, { fund: fresh, at: Date.now() });
        }
      }

      if (fund) {
        stock = {
          ...stock,
          fundamentals: fund,
          marketCap: fund.marketCap ?? stock.marketCap,
          peRatio: fund.peRatio ?? stock.peRatio,
        };

        if (stock._id && stock._id !== "pending") {
          Stock.updateOne(
            { symbol },
            { $set: { marketCap: fund.marketCap ?? 0, peRatio: fund.peRatio ?? 0 } }
          ).catch(() => {});
        }
      }
    } catch (error) {
      console.error("[getStockBySymbol] yahoo fundamentals failed for", symbol, error.message);
    }

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    console.error("[getStockBySymbol]", error);
    res.status(500).json({ success: false, message: "Failed to fetch stock." });
  }
};

export const getLiveStockQuote = async (req, res) => {
  try {
    const symbol = req.params.symbol?.trim().toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, message: "Stock symbol is required" });

    const quote = await fetchUpstoxQuote(symbol);
    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    console.error("[getLiveStockQuote]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch live quote." });
  }
};

export const getStockHistory = async (req, res) => {
  try {
    const symbol = req.params.symbol?.trim().toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, message: "Stock symbol is required" });

    const timeframe = (req.query.tf || req.query.interval || "1D").trim().toUpperCase();
    const config = TIMEFRAME_MAP[timeframe];

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Unsupported timeframe. Use 1D, 1W, 1M, 3M, 1Y or ALL",
      });
    }

    const toDate = req.query.to || new Date().toISOString().split("T")[0];
    const fromDate =
      req.query.from ||
      new Date(Date.now() - config.days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Prefer Upstox candles; fall back to Yahoo when Upstox is blocked/unreachable.
    let history;
    let source = "upstox";
    try {
      history = await fetchUpstoxHistory({
        symbol,
        interval: config.interval,
        fromDate,
        toDate,
      });
    } catch (upstoxErr) {
      console.warn("[getStockHistory] Upstox failed, trying Yahoo:", upstoxErr.message);
      try {
        history = await fetchYahooHistory({ symbol, interval: config.interval });
        source = "yahoo";
      } catch (yahooErr) {
        console.warn("[getStockHistory] Yahoo fallback failed:", yahooErr.message);
        throw new Error(`History unavailable from all sources: ${yahooErr.message}`);
      }
    }

    // Cache the freshly fetched candles so charts keep working after market
    // close and during transient network blocks of the Upstox REST API.
    if (Array.isArray(history?.candles) && history.candles.length) {
      try {
        await StockHistory.findOneAndUpdate(
          { symbol, interval: config.interval },
          {
            symbol,
            instrumentKey: history.instrumentKey || "",
            interval: config.interval,
            fromDate,
            toDate,
            candles: history.candles,
            fetchedAt: new Date(),
          },
          { upsert: true }
        );
      } catch (cacheErr) {
        console.warn("[getStockHistory] cache write failed", cacheErr.message);
      }
    }

    return res.status(200).json({ success: true, data: history, cached: false, source });
  } catch (error) {
    console.error("[getStockHistory]", error);

    // Serve the last known good candles so the chart is never blank/fake.
    try {
      const cached = await StockHistory.findOne({ symbol, interval: config?.interval }).lean();
      if (cached && Array.isArray(cached.candles) && cached.candles.length > 0) {
        return res.status(200).json({
          success: true,
          data: {
            symbol,
            instrumentKey: cached.instrumentKey || "",
            candles: cached.candles,
          },
          cached: true,
          warning: "Live history unavailable — showing last cached data",
        });
      }
    } catch (cacheErr) {
      console.warn("[getStockHistory] cache read failed", cacheErr.message);
    }

    return res.status(503).json({
      success: false,
      message: "Failed to fetch stock history and no cached data is available.",
    });
  }
};

// Import/add stocks by symbols using Upstox quotes (upsert)
export const importStocksFromUpstox = async (req, res) => {
  try {
    const body = req.body || {};
    const symbols = Array.isArray(body.symbols) ? body.symbols : body.symbol ? [body.symbol] : [];
    if (!symbols.length) return res.status(400).json({ success: false, message: "No symbols provided" });

    const results = [];
    for (let raw of symbols) {
      const symbol = String(raw).trim().toUpperCase();
      if (!symbol) continue;
      try {
        const quote = await fetchUpstoxQuote(symbol);
        const details = await getInstrumentDetails(symbol);
        const doc = {
          symbol: quote.symbol || symbol,
          name: details?.name || quote.raw?.name || quote.raw?.instrumentName || quote.symbol || symbol,
          currentPrice: typeof quote.price === "number" ? quote.price : Number(quote.price) || 0,
          previousClose: quote.previousClose ?? quote.close ?? quote.price ?? 0,
          change: quote.change ?? 0,
          changePercent: quote.changePercent ?? 0,
          volume: quote.volume ?? 0,
          lastUpdated: quote.timestamp ? new Date(quote.timestamp) : new Date(),
          isActive: true,
        };
        await Stock.updateOne({ symbol: doc.symbol }, { $set: doc }, { upsert: true });
        results.push({ symbol: doc.symbol, success: true });
      } catch (err) {
        console.error("importStocksFromUpstox failed for", raw, err.message);
        results.push({ symbol: raw, success: false, error: String(err.message) });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("[importStocksFromUpstox]", error);
    res.status(500).json({ success: false, message: "Import failed" });
  }
};
