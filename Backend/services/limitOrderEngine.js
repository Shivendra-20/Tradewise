import Order from "../models/Order.js";
import Stock from "../models/Stock.js";
import { executeFill } from "./orderExecution.js";

// limitHit() — BUY tab trigger hota hai jab market price target se neeche (ya equal) aa jaye,
// SELL tab jab market price target se upar (ya equal) aa jaye.
const limitHit = (order, price) =>
  order.type === "buy" ? price <= order.price : price >= order.price;

// checkLimitOrders() — marketDataFeed ke har live tick pe chalti hai.
// Us symbol ke saare pending limit orders dekhti hai, aur jo target hit ho chuke hain unhe execute kar deti hai.
export const checkLimitOrders = async (symbol, price, io) => {
  if (!price || price <= 0) return;

  try {
    const stock = await Stock.findOne({ symbol, isActive: true })
      .select("_id symbol")
      .lean();

    if (!stock) return;

    const orders = await Order.find({
      stockId: stock._id,
      orderType: "limit",
      status: "pending",
    });

    for (const order of orders) {
      if (!limitHit(order, price)) continue;

      // Atomic claim — agar do ticks ek saath aa jayein to bhi order sirf ek hi baar fill hoga.
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, status: "pending" },
        { $set: { status: "completed", executedAt: new Date(), note: "Limit order auto-executed" } },
        { returnDocument: "after" }
      );

      if (!claimed) continue;

      try {
        const result = await executeFill({
          userId: claimed.userId,
          stockId: stock._id,
          stockSymbol: stock.symbol,
          type: claimed.type,
          quantity: claimed.quantity,
          price,
          orderId: claimed._id,
        });

        console.log(
          `[limitOrders] ${claimed.type.toUpperCase()} filled — ${stock.symbol} x${claimed.quantity} @ ₹${price}`
        );

        io?.to(`user:${claimed.userId}`).emit("order:filled", {
          symbol: stock.symbol,
          type: claimed.type,
          quantity: claimed.quantity,
          price,
          profitLoss: result.profitLoss,
        });
      } catch (error) {
        // paise/holding nahi mili → order ko "failed" mark karo taaki dobara try na ho
        await Order.updateOne(
          { _id: claimed._id },
          { $set: { status: "failed", note: error.message } }
        );
        console.warn(`[limitOrders] ${claimed._id} failed — ${error.message}`);
      }
    }
  } catch (error) {
    console.error("[limitOrders]", error.message);
  }
};