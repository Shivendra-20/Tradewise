import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Stock ID is required"],
    },

    // How many shares the user currently holds
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    // Average price at which user bought this stock
    // Recalculated on every new buy order
    // Formula: ((oldQty * oldAvg) + (newQty * newPrice)) / (oldQty + newQty)
    avgBuyPrice: {
      type: Number,
      required: [true, "Average buy price is required"],
      min: [0, "Average buy price cannot be negative"],
      default: 0,
    },

    // Total amount invested in this stock (quantity × avgBuyPrice)
    totalInvested: {
      type: Number,
      default: 0,
      min: [0, "Total invested cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One user can hold one stock only — quantity increases on buy, decreases on sell
portfolioSchema.index({ userId: 1, stockId: 1 }, { unique: true });
portfolioSchema.index({ userId: 1 }); // fetch all holdings of a user fast

// Auto-calculate totalInvested before every save
portfolioSchema.pre("save", function () {
  this.totalInvested = parseFloat((this.quantity * this.avgBuyPrice).toFixed(2));
});

portfolioSchema.pre(/^find/, function () {
  this.populate({
    path: "stockId",
    select: "symbol name currentPrice changePercent sector logo",
  });
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;