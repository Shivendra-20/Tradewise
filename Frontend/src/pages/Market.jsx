import { useState } from "react";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import MarketHeader from "../components/market/MarketHeader.jsx";
import StockCard from "../components/Market/StockCard.jsx";
// Uncomment after creating these components
import MarketFilters from "../components/market/MarketFilter.jsx";
// import TrendingSection from "../components/market/TrendingSection";
// import StockGrid from "../components/market/StockGrid";
// import SearchModal from "../components/common/SearchModal";

export default function Market() {
  const [searchOpen, setSearchOpen] = useState(false);

const [filters, setFilters] = useState({
  search: "",
  exchange: "All",
  sector: "All",
  sort: "Market Cap",
});


  const stocks = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries",
    logo: "RI",
    price: 2545.65,
    change: 18.45,
      exchange: "NSE",
    changePercent: 0.73,
    sector: "Energy",
    marketCap: "₹17.2L Cr",
    watchlisted: false,
  },
  {
    symbol: "TCS",
    companyName: "Tata Consultancy Services",
    logo: "TC",
    price: 3568.2,
    change: -15.8,
      exchange: "NSE",
    changePercent: -0.44,
    sector: "IT",
    marketCap: "₹13.1L Cr",
    watchlisted: true,
  },
  {
    symbol: "HDFCBANK",
    companyName: "HDFC Bank",
    logo: "HB",
    price: 1984.35,
    change: 12.15,
      exchange: "NSE",
    changePercent: 0.62,
    sector: "Banking",
    marketCap: "₹15.4L Cr",
    watchlisted: false,
  },
];

const filteredStocks = stocks.filter((stock) => {
  const matchSearch =
    stock.companyName
      .toLowerCase()
      .includes(filters.search.toLowerCase()) ||
    stock.symbol
      .toLowerCase()
      .includes(filters.search.toLowerCase());

  const matchSector =
    filters.sector === "All" ||
    stock.sector === filters.sector;

  const matchExchange =
    filters.exchange === "All" ||
    stock.exchange === filters.exchange;

  return matchSearch && matchSector && matchExchange;
});


const sortedStocks = [...filteredStocks].sort((a, b) => {
  switch (filters.sort) {
    case "Price ↑":
      return a.price - b.price;

    case "Price ↓":
      return b.price - a.price;

    case "% Change":
      return b.changePercent - a.changePercent;

    case "Market Cap":
    default:
      return 0; // API ke baad actual market cap compare karenge
  }
});
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Hero Header */}
        <MarketHeader
          marketStatus="OPEN"
          onSearch={() => setSearchOpen(true)}
        />

        {/* ------------------------------------------------ */}
        {/* Filters */}
        {/* ------------------------------------------------ */}
<MarketFilters
  filters={filters}
  setFilters={setFilters}
/>



        {/* ------------------------------------------------ */}
        {/* Trending Stocks */}
        {/* ------------------------------------------------ */}

        {/*
        <TrendingSection
          gainers={[]}
          losers={[]}
          active={[]}
        />
        */}

        {/* ------------------------------------------------ */}
        {/* All Stocks */}
        {/* ------------------------------------------------ */}

        {/*
        <StockGrid
          stocks={stocks}
          loading={loading}
        />
        */}

        {/* Temporary Placeholder */}

       <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
           {
           sortedStocks.map((stock) => (
            <StockCard
             key={stock.symbol}
             stock={stock}
              onWatchlist={(stock) => console.log("Watchlist:", stock)}
           />
        ))}
        </div>

      </div>

      {/* Search Modal */}

      {/*
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      */}

    </DashboardLayout>
  );
}