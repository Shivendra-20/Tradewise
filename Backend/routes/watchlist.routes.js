import Router from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  updateWatchlistNote,
} from "../controllers/Watchlist.controller.js";

const router = Router();

router.post("/add", protectRoute, addToWatchlist);
router.patch("/note/:id", protectRoute, updateWatchlistNote);
router.delete("/remove/:id", protectRoute, removeFromWatchlist);
router.get("/", protectRoute, getWatchlist);

export default router;
