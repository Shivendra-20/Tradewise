import API from "./axios.js";

export const getStocks = (params = {}) => API.get("/stocks", { params });

export const searchStocks = (query) =>
  API.get("/stocks/search", { params: { q: query } });

export const getStockDetails = (symbol) =>
  API.get(`/stocks/${encodeURIComponent(symbol)}`);

export const getMarketSnapshot = async () => {
  try {
    const { data } = await getStocks({ limit: 8 });

    if (data?.success && Array.isArray(data.stocks)) {
      return {
        success: true,
        stocks: data.stocks.map((stock) => ({
          ...stock,
          price: stock.currentPrice ?? 0,
          changePercent: stock.changePercent ?? 0,
        })),
      };
    }
  } catch (error) {
    console.error("Falling back to local stock snapshot", error);
  }

  return {
    success: true,
    stocks: [
      { symbol: "RELIANCE", name: "Reliance Industries", currentPrice: 1586.4, changePercent: 2.31 },
      { symbol: "TCS", name: "Tata Consultancy", currentPrice: 3982.2, changePercent: 1.84 },
      { symbol: "INFY", name: "Infosys", currentPrice: 1742.5, changePercent: -0.52 },
      { symbol: "HDFCBANK", name: "HDFC Bank", currentPrice: 1923.6, changePercent: 0.92 },
      { symbol: "ICICIBANK", name: "ICICI Bank", currentPrice: 1488.1, changePercent: 1.22 },
      { symbol: "SBIN", name: "SBI", currentPrice: 845.75, changePercent: -1.02 },
    ],
  };
};
