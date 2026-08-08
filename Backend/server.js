import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import healthCheckRoute from "./routes/HealthCheck.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import watchlistRoute from "./routes/watchlist.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { startMarketFeed } from "./services/marketDataFeed.js";
import "dotenv/config";

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
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

// Trading & portfolio
app.use("/api/orders", orderRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/transaction", transactionRoutes);

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

// ---------------------------------------------------------------------------
// HTTP + WebSocket (socket.io) server
// ---------------------------------------------------------------------------

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Require a valid JWT for real-time market data
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token || !process.env.JWT_SECRET) {
    return next(new Error("Unauthorized"));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("subscribe:stocks", (symbols) => {
    marketFeed.subscribe(symbols);
  });

  socket.on("unsubscribe:stocks", (symbols) => {
    marketFeed.unsubscribe(symbols);
  });

  socket.on("disconnect", () => {
    // intentionally no-op: feed subscriptions are shared, not per-client
  });
});

const marketFeed = startMarketFeed(io);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
