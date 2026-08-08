import Router from "express";
import {
  getAllStocks,
  getStockBySymbol,
  searchStocks,
  getLiveStockQuote,
  getStockHistory,
  getIndicesQuotes,
  getStockSectors,
  importStocksFromUpstox,
} from "../controllers/Stock.controller.js";

const router = Router();

router.get('/', getAllStocks);
router.get('/search', searchStocks);
router.get('/indices', getIndicesQuotes);
router.get('/sectors', getStockSectors);
router.get('/live/:symbol', getLiveStockQuote);
router.get('/history/:symbol', getStockHistory);
router.post('/import', importStocksFromUpstox);
router.get('/:symbol', getStockBySymbol);

export default router;
