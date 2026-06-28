import Transaction from "../models/Transaction.js";

export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find( { userId: req.user._id })
        .populate("stockId", "symbol name currentPrice sector")
        .populate("orderId", "type orderType status executedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments( { userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
