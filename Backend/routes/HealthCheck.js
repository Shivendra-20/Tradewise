import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;

  const statusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? "TradeWise API is healthy" : "Database unavailable",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: statusMap[dbState] || "unknown",
  });
});

export default router;
