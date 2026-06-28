import Portfolio from "../models/Portfolio.js";

// Logic clarity

export const getPortfolio = async (req, res) => {
  try {
    const round = (num) => Number(num.toFixed(2));

    const holdings = await Portfolio.find({userId: req.user._id,quantity: { $gt: 0 },})
      .populate("stockId", "symbol name currentPrice")
      .select("quantity avgBuyPrice totalInvested stockId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedHoldings = holdings.map((holding) => {
      const stock = holding.stockId;

      const invested = holding.totalInvested ?? holding.quantity * holding.avgBuyPrice;

      const marketValue = stock?.currentPrice? round(holding.quantity * stock.currentPrice): round(invested);

      const unrealizedPL = round(marketValue - invested);

      const unrealizedPLPercent = invested > 0 ? round((unrealizedPL / invested) * 100) : 0;

      return {
        ...holding,
        invested: round(invested),
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
      };
    });

    const summary = enrichedHoldings.reduce(
      (acc, holding) => {
        acc.totalInvested += holding.invested;
        acc.currentValue += holding.marketValue;
        return acc;
      },
      {
        totalInvested: 0,
        currentValue: 0,
      }
    );

    summary.totalInvested = round(summary.totalInvested);
    summary.currentValue = round(summary.currentValue);
    summary.totalUnrealizedPL = round(summary.currentValue - summary.totalInvested);
    summary.totalReturnPercent = summary.totalInvested > 0? round((summary.totalUnrealizedPL / summary.totalInvested) * 100): 0;
    summary.totalNetWorth = round(req.user.virtualBalance + summary.currentValue);
    summary.holdingsCount = enrichedHoldings.length;

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        balance: req.user.virtualBalance,
        initialBalance: req.user.initialBalance,
      },
      summary,
      holdings: enrichedHoldings,
    });
  } catch (error) {
    console.error("[getPortfolio]", {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio.",
    });
  }
};