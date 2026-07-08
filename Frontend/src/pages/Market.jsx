import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import { marketIndices } from "../components/constants/Marketdata.js";
import { gainers, losers } from "../components/constants/Marketmovers.js";
import { popularStocks } from "../components/constants/PopularStocks.js";
import { formatCurrency, formatPercent } from "../lib/formatters.js";

export default function Market() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-400">
                <Sparkles size={16} />
                Live market intelligence
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">Markets at a glance</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Track the broader economy, momentum leaders, and the most watched stocks in one streamlined workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-gray-300">
              <p className="text-gray-500">Market status</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                Open · 09:15 IST
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-xl font-semibold">Market indices</h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {marketIndices.map((index) => (
                <div key={index.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{index.symbol}</h3>
                    <span className="rounded-full bg-green-500/10 px-2 py-1 text-[11px] text-green-400">{index.status}</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{formatCurrency(index.value)}</p>
                  <p className={`mt-2 text-sm font-medium ${index.positive ? "text-green-400" : "text-red-400"}`}>
                    {index.change > 0 ? "+" : ""}{formatCurrency(index.change)} · {formatPercent(index.percent)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp size={18} />
              <h2 className="text-lg font-semibold">Momentum movers</h2>
            </div>
            <div className="mt-5 space-y-3">
              {gainers.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between rounded-2xl bg-zinc-950/70 px-3 py-3">
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-gray-400">{stock.price}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-400">{stock.change}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Popular stocks</h2>
                <p className="text-sm text-gray-400">High-liquidity names traders are watching</p>
              </div>
              <button className="text-sm text-green-400">See all</button>
            </div>

            <div className="space-y-3">
              {popularStocks.slice(0, 6).map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-left transition hover:border-green-500"
                >
                  <div>
                    <p className="font-medium">{stock.symbol}</p>
                    <p className="text-sm text-gray-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stock.price}</p>
                    <p className={`text-sm ${stock.positive ? "text-green-400" : "text-red-400"}`}>{stock.change}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-green-400" />
              <h2 className="text-xl font-semibold">Sector watch</h2>
            </div>

            <div className="space-y-3">
              {[
                { name: "Technology", change: "+1.42%", positive: true },
                { name: "Banking", change: "+0.86%", positive: true },
                { name: "Energy", change: "-0.34%", positive: false },
              ].map((sector) => (
                <div key={sector.name} className="flex items-center justify-between rounded-2xl bg-zinc-950/70 px-4 py-3">
                  <p className="font-medium">{sector.name}</p>
                  <span className={`text-sm font-semibold ${sector.positive ? "text-green-400" : "text-red-400"}`}>
                    {sector.change}
                  </span>
                </div>
              ))}
            </div>

            <button className="mt-6 flex items-center gap-2 text-sm text-green-400">
              Explore sectors <ArrowRight size={16} />
            </button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}