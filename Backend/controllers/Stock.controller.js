import Stock from "../models/Stock.js";

// TODO: 1.Add more filter feature ,like sort by sector ,price,order etc.
// 2. Get stock by sector
// 3. GEt top Gainers and Get top Losers

export const getAllStocks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // cap: 1–100
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    const [stocks, total] = await Promise.all([
      Stock.find(filter)
        .select("symbol name currentPrice marketCap") // only what the client needs
        .sort({ symbol: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Stock.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      stocks,
      pagination: {          // grouped for cleaner API contract
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStocks: total,
        limit,
      },
    });
  } catch (error) {
    console.error("[getAllStocks]", {
      message: error.message,
      stack: error.stack,
      query: req.query,     // helps reproduce the failure
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch stocks. Please try again.",
    });
  }
};

export const searchStocks = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters",
      });
    }

    // Escape regex special chars to prevent ReDoS
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const stocks = await Stock.find({
      isActive: true,
      $or: [
        { symbol: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
      ],
    })
      .select("symbol name currentPrice marketCap") // only what's needed
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
      // No separate branch for empty — count: 0, data: [] is self-explanatory
    });
  } catch (error) {
    console.error("[searchStocks]", {
      message: error.message,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: "Search failed. Please try again.",
    });
  }
};

export const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol?.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required",
      });
    }

    const isValidSymbol = /^[A-Z0-9&]{1,10}$/.test(symbol);
    if (!isValidSymbol) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol format. Example: TCS, HDFCBANK, RELIANCE",
      });
    }

    const stock = await Stock.findOne({ symbol, isActive: true })
      .select("symbol name currentPrice marketCap exchange") // explicit > exclusion
      .lean();

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock "${symbol}" not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error("[getStockBySymbol]", {
      message: error.message,
      symbol: req.params.symbol,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock. Please try again.",
    });
  }
};