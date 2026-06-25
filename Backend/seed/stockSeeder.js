import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock.js";

dotenv.config();

const SECTOR_MAP = {
  IT: "Technology",
  Energy: "Energy",
  Banking: "Finance",
  FMCG: "Consumer Goods",
  Pharma: "Healthcare",
  Automobile: "Industrials",
  Infrastructure: "Industrials",
  Cement: "Materials",
  Telecom: "Communication",
  Diversified: "Other",
  Logistics: "Industrials",
  Finance: "Finance",
  Paints: "Materials",
  "Consumer Goods": "Consumer Goods",
};

const rawStocks = [
  { symbol: "TCS", companyName: "Tata Consultancy Services", sector: "IT", exchange: "NSE", currentPrice: 4200 },
  { symbol: "INFY", companyName: "Infosys", sector: "IT", exchange: "NSE", currentPrice: 1600 },
  { symbol: "WIPRO", companyName: "Wipro", sector: "IT", exchange: "NSE", currentPrice: 550 },
  { symbol: "HCLTECH", companyName: "HCL Technologies", sector: "IT", exchange: "NSE", currentPrice: 1750 },
  { symbol: "TECHM", companyName: "Tech Mahindra", sector: "IT", exchange: "NSE", currentPrice: 1450 },
  { symbol: "RELIANCE", companyName: "Reliance Industries", sector: "Energy", exchange: "NSE", currentPrice: 2900 },
  { symbol: "ONGC", companyName: "Oil and Natural Gas Corporation", sector: "Energy", exchange: "NSE", currentPrice: 320 },
  { symbol: "HDFCBANK", companyName: "HDFC Bank", sector: "Banking", exchange: "NSE", currentPrice: 1800 },
  { symbol: "ICICIBANK", companyName: "ICICI Bank", sector: "Banking", exchange: "NSE", currentPrice: 1400 },
  { symbol: "SBIN", companyName: "State Bank of India", sector: "Banking", exchange: "NSE", currentPrice: 850 },
  { symbol: "AXISBANK", companyName: "Axis Bank", sector: "Banking", exchange: "NSE", currentPrice: 1250 },
  { symbol: "KOTAKBANK", companyName: "Kotak Mahindra Bank", sector: "Banking", exchange: "NSE", currentPrice: 2050 },
  { symbol: "ITC", companyName: "ITC Limited", sector: "FMCG", exchange: "NSE", currentPrice: 470 },
  { symbol: "HINDUNILVR", companyName: "Hindustan Unilever", sector: "FMCG", exchange: "NSE", currentPrice: 2650 },
  { symbol: "NESTLEIND", companyName: "Nestle India", sector: "FMCG", exchange: "NSE", currentPrice: 2450 },
  { symbol: "SUNPHARMA", companyName: "Sun Pharmaceutical Industries", sector: "Pharma", exchange: "NSE", currentPrice: 1750 },
  { symbol: "DRREDDY", companyName: "Dr Reddy's Laboratories", sector: "Pharma", exchange: "NSE", currentPrice: 1350 },
  { symbol: "CIPLA", companyName: "Cipla", sector: "Pharma", exchange: "NSE", currentPrice: 1550 },
  { symbol: "TATAMOTORS", companyName: "Tata Motors", sector: "Automobile", exchange: "NSE", currentPrice: 720 },
  { symbol: "MARUTI", companyName: "Maruti Suzuki", sector: "Automobile", exchange: "NSE", currentPrice: 12800 },
  { symbol: "M&M", companyName: "Mahindra & Mahindra", sector: "Automobile", exchange: "NSE", currentPrice: 3100 },
  { symbol: "LT", companyName: "Larsen & Toubro", sector: "Infrastructure", exchange: "NSE", currentPrice: 3850 },
  { symbol: "ULTRACEMCO", companyName: "UltraTech Cement", sector: "Cement", exchange: "NSE", currentPrice: 12200 },
  { symbol: "BHARTIARTL", companyName: "Bharti Airtel", sector: "Telecom", exchange: "NSE", currentPrice: 1850 },
  { symbol: "ADANIENT", companyName: "Adani Enterprises", sector: "Diversified", exchange: "NSE", currentPrice: 2650 },
  { symbol: "ADANIPORTS", companyName: "Adani Ports", sector: "Logistics", exchange: "NSE", currentPrice: 1450 },
  { symbol: "BAJFINANCE", companyName: "Bajaj Finance", sector: "Finance", exchange: "NSE", currentPrice: 9300 },
  { symbol: "ASIANPAINT", companyName: "Asian Paints", sector: "Paints", exchange: "NSE", currentPrice: 2950 },
  { symbol: "TITAN", companyName: "Titan Company", sector: "Consumer Goods", exchange: "NSE", currentPrice: 3700 },
];

const stocks = rawStocks.map(({ companyName, sector, currentPrice, ...rest }) => ({
  ...rest,
  name: companyName,
  sector: SECTOR_MAP[sector] || "Other",
  currentPrice,
  previousClose: currentPrice,
  dayHigh: currentPrice,
  dayLow: currentPrice,
}));

const seedStocks = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);

    await Stock.deleteMany();
    await Stock.insertMany(stocks);

    console.log(`${stocks.length} stocks seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedStocks();
