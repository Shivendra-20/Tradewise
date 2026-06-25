import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: {
        values: ["buy", "sell"],
        message: "Order type must be buy or sell",
      },
      required: [true, "Order type is required"],
    },

    // "market"  → execute immediately at current price
    // "limit"   → execute only when price hits target
    orderType: {
      type: String,
      enum: {
        values: ["market", "limit"],
        message: "Order type must be market or limit",
      },
      default: "market",
    },

    // "pending"   → waiting to be executed (limit orders)
    // "completed" → successfully executed
    // "cancelled" → cancelled by user before execution
    // "failed"    → execution failed (e.g. insufficient balance)
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "failed"],
      default: "pending",
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    // For market orders: price at time of execution
    // For limit orders: the target price the user sets
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Total value = quantity × price (stored for quick access)
    totalValue: {
      type: Number,
      min: [0, "Total value cannot be negative"],
    },

    // Only filled when order is completed
    executedAt: {
      type: Date,
      default: null,
    },

    // Optional note e.g. "limit order triggered automatically"
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Auto-calculate totalValue before saving
orderSchema.pre("save", function () {
  this.totalValue = this.quantity * this.price;
});

orderSchema.pre(/^find/, function () {
  this.populate({
    path: "stockId",
    select: "symbol name currentPrice",
  });
});

// Useful indexes for common queries
orderSchema.index({ userId: 1, createdAt: -1 }); // fetch user's orders newest first
orderSchema.index({ userId: 1, status: 1 });      // filter by status quickly
orderSchema.index({ status: 1, orderType: 1 });   // find all pending limit orders (for auto-execution)

const Order = mongoose.model("Order", orderSchema);

export default Order;