import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.post("/", protectRoute, placeOrder);
router.get("/", protectRoute, getMyOrders);
router.get("/:id", protectRoute, getOrderById);
router.patch("/cancel/:id", protectRoute, cancelOrder);

export default router;
