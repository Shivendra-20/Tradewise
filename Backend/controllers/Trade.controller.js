import { placeOrder } from "./order.controller.js";

export const buyStock = async (req, res) => {
  req.body = {
    stockId: req.body.stockId,
    quantity: req.body.quantity,
    type: "buy",
    orderType: "market",
  };
  return placeOrder(req, res);
};

export const sellStock = async (req, res) => {
  req.body = {
    stockId: req.body.stockId,
    quantity: req.body.quantity,
    type: "sell",
    orderType: "market",
  };
  return placeOrder(req, res);
};
