import mongoose from "mongoose";
import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import Stock from "../models/Stock.js";

export const buyStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { stockId, quantity } = req.body;

    if (!stockId || !quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Stock ID and quantity are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const stock = await Stock.findOne({ _id: stockId, isActive: true }).session(session);

    if (!stock) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    const price = stock.currentPrice;
    const totalCost = qty * price;

    const user = await User.findById(req.user._id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.virtualBalance < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    user.virtualBalance -= totalCost;
    await user.save({ session });

    const order = new Order({
      userId: user._id,
      stockId,
      type: "buy",
      orderType: "market",
      status: "completed",
      quantity: qty,
      price,
      executedAt: new Date(),
    });
    await order.save({ session });

    let holding = await Portfolio.findOne({
      userId: user._id,
      stockId,
    }).session(session);

    if (holding) {
      const totalShares = holding.quantity + qty;

      holding.avgBuyPrice =
        (holding.avgBuyPrice * holding.quantity + price * qty) / totalShares;
      holding.quantity = totalShares;

      await holding.save({ session });
    } else {
      holding = new Portfolio({
        userId: user._id,
        stockId,
        quantity: qty,
        avgBuyPrice: price,
      });
      await holding.save({ session });
    }

    const transaction = new Transaction({
      userId: user._id,
      stockId,
      orderId: order._id,
      action: "buy",
      quantity: qty,
      price,
    });
    await transaction.save({ session });

    await session.commitTransaction();

    const populatedHolding = await Portfolio.findById(holding._id).select(
      "quantity avgBuyPrice totalInvested stockId"
    );

    return res.status(201).json({
      success: true,
      message: `${stock.name} purchased successfully`,
      remainingBalance: user.virtualBalance,
      orderId: order._id,
      holding: populatedHolding,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Buy Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

export const sellStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { stockId, quantity } = req.body;

    if (!stockId || !quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Stock ID and quantity are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid stock ID",
      });
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const stock = await Stock.findOne({ _id: stockId, isActive: true }).session(session);

    if (!stock) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    const price = stock.currentPrice;

    const user = await User.findById(req.user._id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const holding = await Portfolio.findOne({
      userId: user._id,
      stockId,
    }).session(session);

    if (!holding || holding.quantity < qty) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Not enough shares",
      });
    }

    const remainingShares = holding.quantity - qty;

    if (remainingShares === 0) {
      await holding.deleteOne({ session });
    } else {
      holding.quantity = remainingShares;
      await holding.save({ session });
    }

    user.virtualBalance += qty * price;
    await user.save({ session });

    const order = new Order({
      userId: user._id,
      stockId,
      type: "sell",
      orderType: "market",
      status: "completed",
      quantity: qty,
      price,
      executedAt: new Date(),
    });
    await order.save({ session });

    const transaction = new Transaction({
      userId: user._id,
      stockId,
      orderId: order._id,
      action: "sell",
      quantity: qty,
      price,
    });
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: `${stock.name} sold successfully`,
      updatedBalance: user.virtualBalance,
      remainingShares,
      orderId: order._id,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Sell Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};
