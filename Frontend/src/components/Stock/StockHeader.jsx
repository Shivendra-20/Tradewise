import {ArrowLeft,TrendingUp,TrendingDown,Star,Share2,} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js"
import { useState,useEffect } from "react";
import { useLiveQuote } from "../../lib/realtime.js";

export default function StockHeader({ stock }) {
  const navigate = useNavigate();
  const live = useLiveQuote(stock?.symbol);

  const price = live?.price ?? stock.price;
  const change = live?.change ?? stock.change;
  const changePercent = live?.changePercent ?? stock.changePercent;
  const open = live?.open ?? stock.open;
  const previousClose = live?.previousClose ?? stock.previousClose;

  const positive = change >= 0;
  const isRealStock = /^[a-f\d]{24}$/i.test(stock._id || "");
const [isWatchlisted, setIsWatchlisted] = useState(false);
  useEffect(() => {
  async function checkWatchlist() {
    try {
      const res = await api.get("/api/watchlist");

      const exists = res.data.data.some(
        (item) => item.stockId._id === stock._id
      );

      setIsWatchlisted(exists);
    } catch (err) {
      console.log(err);
    }
  }

  if (isRealStock) {
    checkWatchlist();
  }
}, [stock, isRealStock]);

const toggleWatchlist = async () => {
  try {
    if (isWatchlisted) {
      await api.delete(`/api/watchlist/remove/${stock._id}`);
      setIsWatchlisted(false);
    } else {
      await api.post("/api/watchlist/add", {
        stockId: stock._id,
      });
      setIsWatchlisted(true);
    }
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong");
  }
};


  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-6 shadow-card">

      {/* Top Row */}

      <div className="flex items-center justify-between">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 rounded-xl border border-(--border-color) bg-(--surface-1) px-4 py-2 text-sm transition hover:bg-(--surface-2)"
  >
    <ArrowLeft size={16} />
    Back
  </button>
        <div className="flex gap-3">

          <button onClick={toggleWatchlist} className="rounded-xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:bg-(--surface-2)">
              <Star size={18} className={ isWatchlisted ? "fill-yellow-400 text-yellow-400" : "text-(--text-secondary)"} />
          </button>

          <button className="rounded-xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:bg-(--surface-2)">
            <Share2 size={18} />
          </button>

        </div>
      </div>

      {/* Company */}

      <div className="mt-7 flex items-start gap-5">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-xl font-bold text-blue-500">
          {stock.symbol.slice(0, 2)}
        </div>

        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-3xl font-bold text-(--text-primary)">
              {stock.companyName}
            </h1>

            <span className="rounded-full bg-(--surface-2) px-3 py-1 text-xs">
              {stock.symbol}
            </span>

          </div>

          <p className="mt-2 text-sm text-(--text-secondary)">
            {stock.exchange} • {stock.sector}
          </p>

        </div>
      </div>

      {/* Price */}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">

        <div>

          <h2 className="text-5xl font-bold text-(--text-primary)">
            ₹{price.toLocaleString("en-IN")}
          </h2>

          <div
            className={`mt-3 flex items-center gap-2 text-lg font-semibold ${
              positive ? "text-green-500" : "text-red-500"
            }`}
          >
            {positive ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )}

            ₹{change.toFixed(2)} ({changePercent.toFixed(2)}%)
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-(--surface-2) px-5 py-3">
            <p className="text-xs text-(--text-secondary)">
              Open
            </p>

            <p className="mt-1 font-semibold">
              ₹{open}
            </p>
          </div>

          <div className="rounded-2xl bg-(--surface-2) px-5 py-3">
            <p className="text-xs text-(--text-secondary)">
              Prev Close
            </p>

            <p className="mt-1 font-semibold">
              ₹{previousClose}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}