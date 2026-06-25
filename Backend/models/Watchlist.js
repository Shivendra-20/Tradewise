import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Stock is required"],
    },

    note: {
      type: String,
      trim: true,
      maxlength: [200, "Note cannot exceed 200 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, stockId: 1 }, { unique: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;
