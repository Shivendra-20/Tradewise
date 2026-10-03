import mongoose from "mongoose";
import Order from "../models/Order.js";
import Stock from "../models/Stock.js";
import { executeFill } from "../services/orderExecution.js";
import { subscribe } from "../services/marketDataFeed.js";

const getUserId = (req) => req.user._id;

// Allowed values for filter sanitization
const VALID_ORDER_TYPES   = ["buy", "sell"];
const VALID_ORDER_STATUSES = ["pending", "completed", "cancelled", "failed"];
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

  const userId = getUserId(req);

  const stock = await Stock.findOne({ _id: stockId, isActive: true }).lean();
  if (!stock) {
    return res.status(404).json({ success: false, message: "Stock not found" });
  }

  if (orderType === "limit") {
    const order = await new Order({
      userId,
      stockId,
      type,
      orderType: "limit",
      status: "pending",
      quantity: qty,
      price,
    }).save();

    // Limit order ke liye live ticks chahiye — warna price kabhi check hi nahi hoga.
    subscribe(stock.symbol);

    return res.status(201).json({
      success: true,
      message: "Limit order placed. It will execute automatically when target price is reached.",
      data: { order },
    });
  }

  // Market order — turant current price pe execute
  try {
    const result = await executeFill({
      userId,
      stockId,
      stockSymbol: stock.symbol,
      type,
      quantity: qty,
      price: stock.currentPrice,
    });

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} order executed successfully`,
      data: {
        order: {
          _id: result.orderId,
          type,
          orderType: "market",
          quantity: qty,
          price: stock.currentPrice,
          status: "completed",
        },
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
        profitLoss: result.profitLoss,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
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
      return res.status(400).json({ success: false, message: `Cannot cancel a ${order.status} order` });
    }

    // Note: limit order pe balance reserve nahi hota, isliye cancel karne pe koi refund nahi karna.
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