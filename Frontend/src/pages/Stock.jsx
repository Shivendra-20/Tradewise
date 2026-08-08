import { useParams } from "react-router-dom";

import DashboardLayout from "../components/Layout/DashboardLayout";
import StockHeader from "../components/Stock/StockHeader.jsx";
import StockChart from "../components/Stock/StockChart.jsx";
import OrderPanel from "../components/Stock/OrderPanel.jsx";
import StockStats from "../components/Stock/StockStats.jsx";
import CompanyInfo from "../components/Stock/CompanyOverview.jsx";
import Financials from "../components/Stock/NewsSection.jsx";
import StockFundamentals from "../components/Stock/StockFundamentals.jsx";
import { useEffect, useState } from "react";
import { getStockDetails, getLiveQuote } from "../api/stock.js";

export default function Stock() {
  const { symbol } = useParams();

  const [stock, setStock] = useState(null);

useEffect(() => {
  let intervalId;

  const loadStock = async () => {
    try {
      const res = await getStockDetails(symbol);
      const details = res.data.data;

      setStock({
        ...details,
        companyName: details.name,
        price: details.currentPrice,
        change: details.change ?? 0,
        changePercent: details.changePercent ?? 0,
        open: details.open ?? details.dayHigh ?? 0,
        high: details.high ?? details.dayHigh ?? 0,
        low: details.low ?? details.dayLow ?? 0,
      });
    } catch (error) {
      console.error("Failed to load stock details:", error);
    }
  };

  const loadLiveQuote = async () => {
    try {
      const response = await getLiveQuote(symbol);
      const quote = response.data.data;
      setStock((prev) =>
        prev
          ? {
              ...prev,
              price: quote.price ?? prev.price,
              change: quote.change ?? prev.change,
              changePercent: quote.changePercent ?? prev.changePercent,
              open: quote.open ?? prev.open,
              high: quote.high ?? prev.high,
              low: quote.low ?? prev.low,
              volume: quote.volume ?? prev.volume,
              previousClose: quote.previousClose ?? prev.previousClose,
            }
          : prev
      );
    } catch (error) {
      console.error("Failed to load live quote:", error);
    }
  };

  loadStock();
  intervalId = setInterval(loadLiveQuote, 5000);

  return () => clearInterval(intervalId);
}, [symbol]);

 if (!stock) {
  return (
    <DashboardLayout>
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    </DashboardLayout>
  );
}

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-[1700px] space-y-6">

        {/* Header */}

        <StockHeader stock={stock} />

        {/* Chart + Order */}

        <div className="grid gap-6 xl:grid-cols-[2fr_0.85fr]">

          <StockChart stock={stock} />

          <OrderPanel stock={stock} />

        </div>

        {/* Stats */}

      <div className="mt-6">
         <StockStats stock={stock} />
      </div>
        {/* Company + Financials */}

    <div className="mt-6">
      <StockFundamentals stock={stock} />
    </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <CompanyInfo stock={stock} />

          <Financials stock={stock} />

        </div>

      </div>

    </DashboardLayout>
  );
}