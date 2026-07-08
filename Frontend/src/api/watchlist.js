import API from "./axios.js";

export const getWatchlistItems = () => API.get("/watchlist");

export const addToWatchlist = (stockId, note = "") =>
  API.post("/watchlist/add", { stockId, note });

export const removeFromWatchlist = (stockId) =>
  API.delete(`/watchlist/remove/${stockId}`);

export const updateWatchlistNote = (stockId, note) =>
  API.patch(`/watchlist/note/${stockId}`, { note });
