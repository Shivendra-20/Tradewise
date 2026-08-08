import API from "./axios.js";

export const getStocks = (params = {}) => API.get("/api/stocks", { params });

export const getIndicesQuotes = () => API.get("/api/stocks/indices");

export const getStockSectors = () => API.get("/api/stocks/sectors");

export const searchStocks = (query) =>
  API.get("/api/stocks/search", { params: { q: query } });

export const getStockDetails = (symbol) =>
  API.get(`/api/stocks/${encodeURIComponent(symbol)}`);

export const getLiveQuote = (symbol) =>
  API.get(`/api/stocks/live/${encodeURIComponent(symbol)}`);

export const getStockHistory = (symbol, timeframe = "1D") =>
  API.get(`/api/stocks/history/${encodeURIComponent(symbol)}`, {
    params: { tf: timeframe },
  });
