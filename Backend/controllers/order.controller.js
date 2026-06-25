import mongoose from "mongoose";
import Order       from "../models/Order.js";
import Stock       from "../models/Stock.js";
import Portfolio   from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import User        from "../models/User.js";

// ─── Place Order (Buy or Sell) ───────────────────────────────
// POST /api/orders
// This is the most important function — it touches 4 models atomically
export const placeOrder = async (req, res) => {
  // Use a MongoDB session so if anything fails, everything rolls back
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { stockId, type, orderType = "market", quantity, price } = req.body;
    const userId = req.user.id;

    // ── 1. Validate input ──────────────────────────────────────
    if (!stockId || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "stockId, type, and quantity are required",
      });
    }
    if (!["buy", "sell"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be buy or sell" });
    }
    if (quantity < 1 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
    }

    // ── 2. Fetch stock ─────────────────────────────────────────
    const stock = await Stock.findById(stockId).session(session);
    if (!stock || !stock.isActive) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Stock not found" });
    }

    // For market orders, always use currentPrice
    // For limit orders, use the price the user set
    const executionPrice = orderType === "market" ? stock.currentPrice : price;

    if (!executionPrice || executionPrice <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid price" });
    }

    const totalCost = parseFloat((quantity * executionPrice).toFixed(2));

    // ── 3. Fetch user ──────────────────────────────────────────
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const balanceBefore = user.virtualBalance;
    let   balanceAfter  = balanceBefore;
    let   profitLoss    = null;

    // ── 4. Handle BUY ──────────────────────────────────────────
    if (type === "buy") {
      if (user.virtualBalance < totalCost) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₹${totalCost}, Available: ₹${user.virtualBalance}`,
        });
      }

      // Deduct balance
      user.virtualBalance = parseFloat((user.virtualBalance - totalCost).toFixed(2));
      balanceAfter = user.virtualBalance;
      await user.save({ session, validateBeforeSave: false });

      // Update portfolio (create if first time buying, update avgBuyPrice if already holding)
      const existing = await Portfolio.findOne({ userId, stockId }).session(session);

      if (existing) {
        // Recalculate average buy price
        // Formula: ((oldQty * oldAvg) + (newQty * newPrice)) / (oldQty + newQty)
        const newAvg = parseFloat(
          ((existing.quantity * existing.avgBuyPrice + quantity * executionPrice) /
            (existing.quantity + quantity)).toFixed(2)
        );
        existing.quantity    += Number(quantity);
        existing.avgBuyPrice  = newAvg;
        await existing.save({ session });
      } else {
        await Portfolio.create(
          [{ userId, stockId, quantity: Number(quantity), avgBuyPrice: executionPrice }],
          { session }
        );
      }
    }

    // ── 5. Handle SELL ─────────────────────────────────────────
    if (type === "sell") {
      const holding = await Portfolio.findOne({ userId, stockId }).session(session);

      if (!holding || holding.quantity < quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Not enough shares. You hold ${holding?.quantity || 0}, trying to sell ${quantity}`,
        });
      }

      // Calculate profit/loss for this sell
      profitLoss = parseFloat(
        ((executionPrice - holding.avgBuyPrice) * quantity).toFixed(2)
      );

      // Add money back to balance
      user.virtualBalance = parseFloat((user.virtualBalance + totalCost).toFixed(2));
      balanceAfter = user.virtualBalance;
      await user.save({ session, validateBeforeSave: false });

      // Reduce portfolio quantity
      holding.quantity -= Number(quantity);

      if (holding.quantity === 0) {
        // User sold all shares — remove from portfolio
        await Portfolio.findByIdAndDelete(holding._id, { session });
      } else {
        await holding.save({ session });
      }
    }

    // ── 6. Create Order record ─────────────────────────────────
    const [order] = await Order.create(
      [{
        userId,
        stockId,
        type,
        orderType,
        status:      "completed",
        quantity:    Number(quantity),
        price:       executionPrice,
        executedAt:  new Date(),
      }],
      { session }
    );

    // ── 7. Create Transaction record ───────────────────────────
    await Transaction.create(
      [{
        userId,
        stockId,
        orderId:     order._id,
        action:      type,
        quantity:    Number(quantity),
        price:       executionPrice,
        balanceBefore,
        balanceAfter,
        profitLoss,
        stockSymbol: stock.symbol,
      }],
      { session }
    );

    // ── 8. Commit everything ───────────────────────────────────
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} order placed successfully`,
      data: {
        order: {
          _id:        order._id,
          type:       order.type,
          orderType:  order.orderType,
          quantity:   order.quantity,
          price:      order.price,
          totalValue: order.totalValue,
          status:     order.status,
        },
        balanceBefore,
        balanceAfter,
        profitLoss,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("[placeOrder]", error);
    res.status(500).json({ success: false, message: "Order failed. Please try again." });
  } finally {
    session.endSession();
  }
};

// ─── Get user's orders ───────────────────────────────────────
// GET /api/orders?page=1&limit=10&type=buy&status=completed
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
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
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ─── Get single order ─────────────────────────────────────────
// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id:    req.params.id,
      userId: req.user.id,   // ensure user owns this order
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("[getOrderById]", error);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ─── Cancel pending order ────────────────────────────────────
// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id:    req.params.id,
      userId: req.user.id,
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

    res.status(200).json({
      success: true,
      message: "Order cancelled",
      data: order,
    });
  } catch (error) {
    console.error("[cancelOrder]", error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};