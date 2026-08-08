import mongoose from "mongoose";

const candleSchema = new mongoose.Schema(
  {
    time: { type: Number, required: true },
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
  },
  { _id: false }
);

const stockHistorySchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    instrumentKey: {
      type: String,
      default: "",
    },
    interval: {
      type: String,
      required: true,
      enum: ["1minute", "30minute", "day", "week", "month"],
    },
    fromDate: { type: String },
    toDate: { type: String },
    candles: { type: [candleSchema], default: [] },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockHistorySchema.index({ symbol: 1, interval: 1 }, { unique: true });

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

export default StockHistory;
