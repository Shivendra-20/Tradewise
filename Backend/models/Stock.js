import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, "Stock symbol is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, "Symbol cannot exceed 10 characters"],
    },

    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    sector: {
      type: String,
      enum: [
        "Technology",
        "Finance",
        "Healthcare",
        "Energy",
        "Consumer Goods",
        "Industrials",
        "Real Estate",
        "Utilities",
        "Materials",
        "Communication",
        "Other",
      ],
      default: "Other",
    },

    exchange: {
      type: String,
      enum: ["NSE", "BSE", "NASDAQ", "NYSE"],
      default: "NSE",
    },

    // Current live price (updated via WebSocket / cron job)
    currentPrice: {
      type: Number,
      required: [true, "Current price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Previous day closing price
    previousClose: {
      type: Number,
      default: 0,
    },

    // Price change today (absolute value)
    change: {
      type: Number,
      default: 0,
    },

    // Price change today (percentage)
    changePercent: {
      type: Number,
      default: 0,
    },

    // Day high and low
    dayHigh: {
      type: Number,
      default: 0,
    },

    dayLow: {
      type: Number,
      default: 0,
    },

    // 52-week range
    weekHigh52: {
      type: Number,
      default: 0,
    },

    weekLow52: {
      type: Number,
      default: 0,
    },

    marketCap: {
      type: Number,
      default: 0,
    },

    volume: {
      type: Number,
      default: 0,
    },

    // P/E ratio, useful for stock analysis
    peRatio: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    logo: {
      type: String, // URL to company logo
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true, // set to false to delist a stock
    },

    // Timestamp of last price update (from API/WebSocket)
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast search by symbol and name
stockSchema.index({ name: "text", symbol: "text" });
stockSchema.index({ sector: 1 });
stockSchema.index({ isActive: 1 });

// Auto-calculate change and changePercent before saving
stockSchema.pre("save", function () {
  if (this.previousClose && this.previousClose > 0) {
    this.change = parseFloat((this.currentPrice - this.previousClose).toFixed(2));
    this.changePercent = parseFloat(
      (((this.currentPrice - this.previousClose) / this.previousClose) * 100).toFixed(2)
    );
  }
});

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;