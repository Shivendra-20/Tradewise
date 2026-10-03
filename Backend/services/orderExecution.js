import mongoose from "mongoose";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

const money = (n) => parseFloat(n.toFixed(2));

// executeFill() — ek buy/sell ko execute karta hai: balance, portfolio aur transaction ledger update.
// Market order aur limit order dono yahi function call karte hain, taaki dono ka behaviour same rahe.
//
// orderId dena = limit order (wo order pehle se "pending" hai, sirf money/portfolio update hoga).
// orderId na dena = market order (naya "completed" order yahin ban jayega).
export const executeFill = async ({
  userId,
  stockId,
  stockSymbol,
  type,
  quantity,
  price,
  orderId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const totalCost = money(quantity * price);
    const balanceBefore = user.virtualBalance;
    let profitLoss = null;

    if (type === "buy") {
      if (user.virtualBalance < totalCost) {
        throw new Error(`Insufficient balance. Required: ₹${totalCost}, Available: ₹${user.virtualBalance}`);
      }

      user.virtualBalance = money(user.virtualBalance - totalCost);
      await user.save({ session });

      // holding pehle se hai → weighted average price update, warna naya holding banao
      const holding = await Portfolio.findOne({ userId, stockId }).session(session);

      if (holding) {
        const newQty = holding.quantity + quantity;
        holding.avgBuyPrice = money(
          (holding.quantity * holding.avgBuyPrice + quantity * price) / newQty
        );
        holding.quantity = newQty;
        await holding.save({ session });
      } else {
        await new Portfolio({ userId, stockId, quantity, avgBuyPrice: price }).save({ session });
      }
    }

    if (type === "sell") {
      const holding = await Portfolio.findOne({ userId, stockId }).session(session);

      if (!holding || holding.quantity < quantity) {
        throw new Error(`Not enough shares. You hold ${holding?.quantity || 0}, trying to sell ${quantity}`);
      }

      profitLoss = money((price - holding.avgBuyPrice) * quantity);

      user.virtualBalance = money(user.virtualBalance + totalCost);
      await user.save({ session });

      holding.quantity -= quantity;

      if (holding.quantity === 0) {
        await holding.deleteOne({ session });
      } else {
        await holding.save({ session });
      }
    }

    const order = orderId
      ? { _id: orderId }
      : await new Order({
          userId,
          stockId,
          type,
          orderType: "market",
          status: "completed",
          quantity,
          price,
          executedAt: new Date(),
        }).save({ session });

    await new Transaction({
      userId,
      stockId,
      orderId: order._id,
      action: type,
      quantity,
      price,
      stockSymbol,
      balanceBefore,
      balanceAfter: user.virtualBalance,
      profitLoss,
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      orderId: order._id,
      balanceBefore,
      balanceAfter: user.virtualBalance,
      profitLoss,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};