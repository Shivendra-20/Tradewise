import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Star, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import api from "../api/axios.js";

export default function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState(null);

  

  async function fetchWatchlist() {
    try {
      setError(false);
      const res = await api.get("/api/watchlist");

    const data = res.data.data.map((item) => ({
        stockId: item.stockId._id,
        symbol: item.stockId.symbol,
        name: item.stockId.name,
        price: item.stockId.currentPrice,
        change: item.stockId.changePercent,
    }));

    setWatchlist(data);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
      setError(true);
      setWatchlist([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchWatchlist();
  }, []);

  async function removeFromWatchlist(stockId) {
    const previous = watchlist;
    // optimistic update — remove immediately, roll back if the API call fails
   setWatchlist((prev) => prev.filter((stock) => stock.stockId !== stockId));
    setRemovingSymbol(stockId);

    try {
     await api.delete(`/api/watchlist/remove/${stockId}`);
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
      setWatchlist(previous); // rollback on failure
    } finally {
      setRemovingSymbol(null);
    }
  }

  const isLoading = watchlist === null;
  const list = watchlist ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-(--border-color) bg-gradient-to-br from-(--bg-secondary) via-(--bg-secondary) to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-(--text-secondary)">Watchlist</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your custom market radar</h1>
              <p className="mt-3 max-w-2xl text-sm text-(--text-secondary) sm:text-base">
                Keep your best ideas organized and monitor the names you want to act on quickly.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-400">
              <Star size={16} />
              {isLoading ? "…" : `${list.length} tracked stock${list.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Couldn't reach the server.
              <button onClick={fetchWatchlist} className="ml-auto flex items-center gap-1 font-medium hover:underline">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
        </motion.section>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Tracked names</h2>
              <p className="text-sm text-(--text-secondary)">Stay close to price action without clutter.</p>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-(--surface-2)" />
              ))
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-(--border-color) bg-(--surface-2)/50 p-6 text-center text-(--text-secondary)">
                Your watchlist is empty right now.
              </div>
            ) : (
              list.map((stock) => {
                const isPositive = stock.change >= 0;
                const isRemoving = removingSymbol === stock.stockId;
                return (
                  <div
                    key={stock.symbol}
                    className={`flex flex-col gap-3 rounded-2xl border border-(--border-color) bg-(--surface-2) p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                      isRemoving ? "opacity-50" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{stock.symbol}</p>
                      <p className="text-sm text-(--text-secondary)">{stock.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">₹{stock.price.toLocaleString("en-IN")}</p>
                        <p className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : ""}
                          {stock.change}%
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        title="View chart"
                        className="rounded-xl border border-(--border-color) bg-(--surface-1) p-2 text-(--text-secondary) transition hover:border-green-500 hover:text-green-400"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                       onClick={() => removeFromWatchlist(stock.stockId)}
                        disabled={isRemoving}
                        className="rounded-xl border border-(--border-color) bg-(--surface-1) px-3 py-2 text-sm text-(--text-secondary) transition hover:border-red-400 hover:text-red-400 disabled:cursor-not-allowed"
                      >
                        {isRemoving ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}