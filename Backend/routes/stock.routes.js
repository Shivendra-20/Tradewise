import Router from "express";
import { getAllStocks, getStockBySymbol, searchStocks } from "../controllers/Stock.controller.js";

const router = Router();

router.get('/',getAllStocks);
router.get('/search',searchStocks);
router.get('/:symbol',getStockBySymbol);

export default router;