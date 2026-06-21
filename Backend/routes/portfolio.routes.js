import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getPortfolio } from "../controllers/Portfolio.controller.js";

const router = Router();

router.get("/",protectRoute,getPortfolio);

export default router;
