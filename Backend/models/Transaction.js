import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    action: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      min: 0,
    },

    stockSymbol: {
      type: String,
      trim: true,
    },

    balanceBefore: {
      type: Number,
    },

    balanceAfter: {
      type: Number,
    },

    profitLoss: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.pre("save", function () {
  this.total = parseFloat((this.quantity * this.price).toFixed(2));
});

transactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
