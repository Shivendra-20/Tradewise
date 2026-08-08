import API from "./axios.js";

export const addToWatchlist = (stockId, note = "") =>
  API.post("/api/watchlist/add", { stockId, note });

export const removeFromWatchlist = (stockId) =>
  API.delete(`/api/watchlist/remove/${stockId}`);
