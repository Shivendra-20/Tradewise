import { useParams } from "react-router-dom";

import DashboardLayout from "../components/Layout/DashboardLayout";
import StockHeader from "../components/Stock/StockHeader.jsx";
import StockChart from "../components/Stock/StockChart.jsx";
import OrderPanel from "../components/Stock/OrderPanel.jsx";
import StockStats from "../components/Stock/StockStats.jsx";
import CompanyInfo from "../components/Stock/CompanyOverview.jsx";
import Financials from "../components/Stock/NewsSection.jsx";
import StockFundamentals from "../components/Stock/StockFundamentals.jsx"
import { useEffect, useState } from "react";
import api from "../api/axios";

import { getStockProfile } from "../lib/stockMockData.js";  

export default function Stock() {
  const { symbol } = useParams();

  const [stock, setStock] = useState(null);

useEffect(() => {
  api.get(`/stocks/${symbol}`)
    .then((res) => {
      setStock({
        ...res.data.data,
        companyName: res.data.data.name,
        price: res.data.data.currentPrice,
      });
    })
    .catch(console.error);
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
      <StockFundamentals/>
    </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <CompanyInfo stock={stock} />

          <Financials stock={stock} />

        </div>

      </div>

    </DashboardLayout>
  );
}