import Portfolio from "../models/Portfolio.js";

export const getPortfolio = async (req, res) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user._id, quantity: { $gt: 0 } })
      .select("quantity avgBuyPrice totalInvested stockId createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        balance: req.user.virtualBalance,
      },
      count: holdings.length,
      holdings,
    });
  } catch (error) {
    console.error("Get Portfolio Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
