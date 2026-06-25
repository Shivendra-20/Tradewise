import Router from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../controllers/Watchlist.controller.js";

const router = Router();

router.post("/add",protectRoute,addToWatchlist);
router.delete("/remove/:id",protectRoute,removeFromWatchlist);
router.get("/",protectRoute,getWatchlist);

export default router;