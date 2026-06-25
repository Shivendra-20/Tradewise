import Stock from "../models/Stock.js";

export const getAllStocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    const [stocks, total] = await Promise.all([
      Stock.find(filter).sort({ symbol: 1 }).skip(skip).limit(limit).lean(),
      Stock.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      stocks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalStocks: total,
    });
  } catch (error) {
    console.error("[getAllStocks]", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stocks. Please try again.",
    });
  }
};

export const searchStocks = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(400).json({ message: "Please provide a search term" });
    }

    const stocks = await Stock.find({
      isActive: true,
      $or: [
        { symbol: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .limit(20)
      .lean();

    if (stocks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No stocks found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    console.error("searchStocks Error:", error);
    res.status(500).json({ message: "Search failed. Please try again." });
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
      .select("-__v")
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
    console.error("[getStockBySymbol]", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock. Please try again.",
    });
  }
};
