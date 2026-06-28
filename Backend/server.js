import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import healthCheckRoute from "./routes/HealthCheck.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import tradeRoutes from "./routes/trade.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import watchlistRoute from "./routes/watchlist.routes.js";
import orderRoutes from "./routes/order.routes.js";
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
  res.json({ success: true, message: "TradeWise API Running" });
});

// Auth & health
app.use("/api/auth", authRoutes);
app.use("/api/health", healthCheckRoute);
app.use("/Health", healthCheckRoute);

// Trading & portfolio
app.use("/api/orders", orderRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/trade", tradeRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/transaction", transactionRoutes);

// Stocks & watchlist
app.use("/api/stocks", stockRoutes);
app.use("/api/watchlist", watchlistRoute);

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
