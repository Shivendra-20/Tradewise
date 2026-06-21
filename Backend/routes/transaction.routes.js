import Router from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getTransactions } from "../controllers/Transaction.controller.js";

const router = Router();

router.get("/",protectRoute,getTransactions);

export default router;
