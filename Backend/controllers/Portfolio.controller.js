import Portfolio from "../models/Portfolio.js";

export const getPortfolio = async (req, res) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user._id, quantity: { $gt: 0 } })
      .select("quantity avgBuyPrice totalInvested stockId createdAt")
      .sort({ createdAt: -1 });

    let totalInvested = 0;
    let currentValue = 0;

    const enrichedHoldings = holdings.map((holding) => {
      const stock = holding.stockId;
      const invested = holding.totalInvested || holding.quantity * holding.avgBuyPrice;
      const marketValue = stock?.currentPrice
        ? parseFloat((holding.quantity * stock.currentPrice).toFixed(2))
        : invested;
      const unrealizedPL = parseFloat((marketValue - invested).toFixed(2));
      const unrealizedPLPercent =
        invested > 0 ? parseFloat(((unrealizedPL / invested) * 100).toFixed(2)) : 0;

      totalInvested += invested;
      currentValue += marketValue;

      return {
        ...holding.toObject(),
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
      };
    });

    const totalUnrealizedPL = parseFloat((currentValue - totalInvested).toFixed(2));

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        balance: req.user.virtualBalance,
        initialBalance: req.user.initialBalance,
      },
      summary: {
        holdingsCount: enrichedHoldings.length,
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalUnrealizedPL,
        totalNetWorth: parseFloat((req.user.virtualBalance + currentValue).toFixed(2)),
      },
      count: enrichedHoldings.length,
      holdings: enrichedHoldings,
    });
  } catch (error) {
    console.error("Get Portfolio Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
