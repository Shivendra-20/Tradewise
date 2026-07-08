import { motion } from "framer-motion";
import { Eye, Star } from "lucide-react";
import { useState } from "react";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";

const initialWatchlist = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: "₹1,586.40", change: "+2.31%" },
  { symbol: "TCS", name: "Tata Consultancy", price: "₹3,982.20", change: "+1.84%" },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: "₹1,923.60", change: "+0.92%" },
];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(initialWatchlist);

  const removeFromWatchlist = (symbol) => {
    setWatchlist((prev) => prev.filter((stock) => stock.symbol !== symbol));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-gray-400">Watchlist</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your custom market radar</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Keep your best ideas organized and monitor the names you want to act on quickly.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-400">
              <Star size={16} />
              {watchlist.length} tracked stocks
            </div>
          </div>
        </motion.section>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Tracked names</h2>
              <p className="text-sm text-gray-400">Stay close to price action without clutter.</p>
            </div>
          </div>

          <div className="space-y-3">
            {watchlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-6 text-center text-gray-400">
                Your watchlist is empty right now.
              </div>
            ) : (
              watchlist.map((stock) => (
                <div key={stock.symbol} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-gray-400">{stock.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{stock.price}</p>
                      <p className="text-sm text-green-400">{stock.change}</p>
                    </div>
                    <button className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-gray-300 transition hover:border-green-500 hover:text-green-400">
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(stock.symbol)}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}