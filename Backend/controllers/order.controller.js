import mongoose from "mongoose";
import Order from "../models/Order.js";
import Stock from "../models/Stock.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const getUserId = (req) => req.user._id;

// fix #8 — session bhi end karo abort ke saath
const abortAndRespond = async (session, res, status, message) => {
  await session.abortTransaction();
  session.endSession();
  return res.status(status).json({ success: false, message });
};

// Allowed values for filter sanitization
const VALID_ORDER_TYPES   = ["buy", "sell"];
const VALID_ORDER_STATUSES = ["pending", "completed", "cancelled"];
const VALID_EXECUTION_TYPES = ["market", "limit"];

export const placeOrder = async (req, res) => {
  const { stockId, type, orderType = "market", quantity, price } = req.body;

  // fix #3 — validate everything BEFORE starting a session
  if (!stockId || !type || !quantity) {
    return res.status(400).json({ success: false, message: "stockId, type, and quantity are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(stockId)) {
    return res.status(400).json({ success: false, message: "Invalid stock ID" });
  }

  if (!VALID_ORDER_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: "type must be buy or sell" });
  }

  // fix #4 — parseInt instead of Number()
  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
  }

  if (!VALID_EXECUTION_TYPES.includes(orderType)) {
    return res.status(400).json({ success: false, message: "orderType must be market or limit" });
  }

  if (orderType === "limit" && (!price || price <= 0)) {
    return res.status(400).json({ success: false, message: "price is required for limit orders" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = getUserId(req);

    const stock = await Stock.findOne({ _id: stockId, isActive: true }).session(session);
    if (!stock) {
      return abortAndRespond(session, res, 404, "Stock not found");
    }

    if (orderType === "limit") {
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
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Limit order placed successfully",
        data: { order },
      });
    }

    // Market order execution
    const executionPrice = stock.currentPrice;
    const totalCost = parseFloat((qty * executionPrice).toFixed(2));

    const user = await User.findById(userId).session(session);
    if (!user) {
      return abortAndRespond(session, res, 404, "User not found");
    }

    const balanceBefore = user.virtualBalance;
    let balanceAfter;
    let profitLoss = null;

    if (type === "buy") {
      if (user.virtualBalance < totalCost) {
        return abortAndRespond(
          session, res, 400,
          `Insufficient balance. Required: ₹${totalCost}, Available: ₹${user.virtualBalance}`
        );
      }

      user.virtualBalance = parseFloat((user.virtualBalance - totalCost).toFixed(2));
      balanceAfter = user.virtualBalance;
      await user.save({ session });

      const existing = await Portfolio.findOne({ userId, stockId }).session(session);

      if (existing) {
        const newQty   = existing.quantity + qty;
        const newAvg   = parseFloat(
          ((existing.quantity * existing.avgBuyPrice + qty * executionPrice) / newQty).toFixed(2)
        );
        existing.quantity      = newQty;
        existing.avgBuyPrice   = newAvg;
        existing.totalInvested = parseFloat((newQty * newAvg).toFixed(2)); // fix #1
        await existing.save({ session });
      } else {
        await new Portfolio({
          userId,
          stockId,
          quantity: qty,
          avgBuyPrice: executionPrice,
          totalInvested: totalCost, // fix #1
        }).save({ session });
      }
    }

    if (type === "sell") {
      const holding = await Portfolio.findOne({ userId, stockId }).session(session);

      if (!holding || holding.quantity < qty) {
        return abortAndRespond(
          session, res, 400,
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
        // fix #1 — totalInvested bhi update karo on partial sell
        holding.totalInvested = parseFloat((holding.quantity * holding.avgBuyPrice).toFixed(2));
        await holding.save({ session });
      }
    }

    const order = new Order({
      userId, stockId, type,
      orderType: "market",
      status: "completed",
      quantity: qty,
      price: executionPrice,
      executedAt: new Date(),
    });
    await order.save({ session });

    await new Transaction({
      userId, stockId,
      orderId: order._id,
      action: type,
      quantity: qty,
      price: executionPrice,
      stockSymbol: stock.symbol,
      balanceBefore,
      balanceAfter,
      profitLoss,
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

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
          status: order.status,
        },
        balanceBefore,
        balanceAfter,
        profitLoss,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("[placeOrder]", { message: error.message, userId: req.user?._id });
    return res.status(500).json({ success: false, message: "Order failed. Please try again." });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const skip  = (page - 1) * limit;

    const filter = { userId };

    // fix #5 — whitelist allowed values before putting in filter
    if (req.query.type   && VALID_ORDER_TYPES.includes(req.query.type))     filter.type   = req.query.type;
    if (req.query.status && VALID_ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

    // fix #7 — .lean() for read-only fetch
    const order = await Order.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    }).lean();

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
  // fix #6 — session ready for future balance refund logic
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return abortAndRespond(session, res, 400, "Invalid order ID");
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    }).session(session);

    if (!order) {
      return abortAndRespond(session, res, 404, "Order not found");
    }

    if (order.status !== "pending") {
      return abortAndRespond(session, res, 400, `Cannot cancel a ${order.status} order`);
    }

    order.status = "cancelled";
    await order.save({ session });

    // TODO: if limit order, refund reserved balance here inside same session

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Order cancelled",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("[cancelOrder]", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};