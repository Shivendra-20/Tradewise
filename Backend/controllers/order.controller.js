import mongoose from "mongoose";
import Order from "../models/Order.js";
import Stock from "../models/Stock.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const getUserId = (req) => req.user._id;

const abortAndRespond = async (session, res, status, message) => {
  await session.abortTransaction();
  return res.status(status).json({ success: false, message });
};

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { stockId, type, orderType = "market", quantity, price } = req.body;
    const userId = getUserId(req);
    const qty = Number(quantity);

    if (!stockId || !type || !quantity) {
      return abortAndRespond(session, res, 400, "stockId, type, and quantity are required");
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return abortAndRespond(session, res, 400, "Invalid stock ID");
    }

    if (!["buy", "sell"].includes(type)) {
      return abortAndRespond(session, res, 400, "type must be buy or sell");
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return abortAndRespond(session, res, 400, "quantity must be a positive integer");
    }

    if (!["market", "limit"].includes(orderType)) {
      return abortAndRespond(session, res, 400, "orderType must be market or limit");
    }

    const stock = await Stock.findOne({ _id: stockId, isActive: true }).session(session);

    if (!stock) {
      return abortAndRespond(session, res, 404, "Stock not found");
    }

    // Limit orders: store as pending — execution happens when price matches (future cron/job)
    if (orderType === "limit") {
      if (!price || price <= 0) {
        return abortAndRespond(session, res, 400, "price is required for limit orders");
      }

      const order = new Order({
        userId,
        stockId,
        type,
        orderType: "limit",
        status: "pending",
        quantity: qty,
        price,
      });
      await order.save({ session });

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Limit order placed successfully",
        data: { order },
      });
    }

    const executionPrice = stock.currentPrice;
    const totalCost = parseFloat((qty * executionPrice).toFixed(2));

    const user = await User.findById(userId).session(session);

    if (!user) {
      return abortAndRespond(session, res, 404, "User not found");
    }

    const balanceBefore = user.virtualBalance;
    let balanceAfter = balanceBefore;
    let profitLoss = null;

    if (type === "buy") {
      if (user.virtualBalance < totalCost) {
        return abortAndRespond(
          session,
          res,
          400,
          `Insufficient balance. Required: ₹${totalCost}, Available: ₹${user.virtualBalance}`
        );
      }

      user.virtualBalance = parseFloat((user.virtualBalance - totalCost).toFixed(2));
      balanceAfter = user.virtualBalance;
      await user.save({ session });

      const existing = await Portfolio.findOne({ userId, stockId }).session(session);

      if (existing) {
        const newAvg = parseFloat(
          (
            (existing.quantity * existing.avgBuyPrice + qty * executionPrice) /
            (existing.quantity + qty)
          ).toFixed(2)
        );
        existing.quantity += qty;
        existing.avgBuyPrice = newAvg;
        await existing.save({ session });
      } else {
        const holding = new Portfolio({
          userId,
          stockId,
          quantity: qty,
          avgBuyPrice: executionPrice,
        });
        await holding.save({ session });
      }
    }

    if (type === "sell") {
      const holding = await Portfolio.findOne({ userId, stockId }).session(session);

      if (!holding || holding.quantity < qty) {
        return abortAndRespond(
          session,
          res,
          400,
          `Not enough shares. You hold ${holding?.quantity || 0}, trying to sell ${qty}`
        );
      }

      profitLoss = parseFloat(((executionPrice - holding.avgBuyPrice) * qty).toFixed(2));

      user.virtualBalance = parseFloat((user.virtualBalance + totalCost).toFixed(2));
      balanceAfter = user.virtualBalance;
      await user.save({ session });

      holding.quantity -= qty;

      if (holding.quantity === 0) {
        await holding.deleteOne({ session });
      } else {
        await holding.save({ session });
      }
    }

    const order = new Order({
      userId,
      stockId,
      type,
      orderType: "market",
      status: "completed",
      quantity: qty,
      price: executionPrice,
      executedAt: new Date(),
    });
    await order.save({ session });

    const transaction = new Transaction({
      userId,
      stockId,
      orderId: order._id,
      action: type,
      quantity: qty,
      price: executionPrice,
      stockSymbol: stock.symbol,
      balanceBefore,
      balanceAfter,
      profitLoss,
    });
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} order executed successfully`,
      data: {
        order: {
          _id: order._id,
          type: order.type,
          orderType: order.orderType,
          quantity: order.quantity,
          price: order.price,
          totalValue: order.totalValue,
          status: order.status,
        },
        balanceBefore,
        balanceAfter,
        profitLoss,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("[placeOrder]", error);
    return res.status(500).json({ success: false, message: "Order failed. Please try again." });
  } finally {
    session.endSession();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[getMyOrders]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("[getOrderById]", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${order.status} order`,
      });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled",
      data: order,
    });
  } catch (error) {
    console.error("[cancelOrder]", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};
