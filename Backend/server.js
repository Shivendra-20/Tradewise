import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import HealthCheckRoute from "./routes/HealthCheck.js";
import PortfolioRoutes from "./routes/portfolio.routes.js";
import TradeRoutes from "./routes/trade.routes.js";
import TransactionRoutes from "./routes/transaction.routes.js";
import StockRoutes from "./routes/stock.routes.js";
import WatchlistRoute from "./routes/watchlist.routes.js";
import "dotenv/config";

const PORT = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("TradeWise API Running");
});

app.use("/api/auth", authRoutes);
app.use("/Health", HealthCheckRoute);
app.use("/portfolio", PortfolioRoutes);
app.use("/trade", TradeRoutes);
app.use("/transaction", TransactionRoutes);
app.use("/api/stocks", StockRoutes);
app.use("/api/watchlist", WatchlistRoute);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
