import API from "./axios.js";

export const getPortfolioSummary = () => API.get("/portfolio");
