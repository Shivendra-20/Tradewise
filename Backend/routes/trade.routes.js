import Router from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { buyStock, sellStock } from "../controllers/Trade.controller.js";

const router = Router();

router.post("/buy",protectRoute,buyStock);
router.post("/sell",protectRoute,sellStock);

export default router;
