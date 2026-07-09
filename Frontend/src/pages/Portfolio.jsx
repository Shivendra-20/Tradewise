import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Wallet, RefreshCw } from "lucide-react";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import { formatCurrency, formatPercent } from "../lib/formatters.js";
import api from "../api/axios.js"; // your configured axios instance with JWT interceptor

export default function Portfolio() {
  // 1. States updated with summary state
  const [rawHoldings, setRawHoldings] = useState(null); // null = loading
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState(null);

  // 2 & 3. fetchPortfolio modernised according to backend API and fallback reset
  async function fetchPortfolio() {
    try {
      setError(false);
      const portfolioRes = await api.get("/portfolio");
      
      setRawHoldings(portfolioRes.data.holdings);
      setSummary(portfolioRes.data.summary);
      setBalance(portfolioRes.data.user.balance);
    } catch (err) {
      console.error("Failed to load portfolio:", err);
      setError(true);
      setRawHoldings([]);
      setSummary(null);
      setBalance(0);
    }
  }

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const isLoading = rawHoldings === null;
  // 4. Fallback intact
  const holdings = rawHoldings ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-(--border-color) bg-gradient-to-br from-(--bg-secondary) via-(--bg-secondary) to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-(--text-secondary)">Portfolio overview</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your paper trading performance</h1>
              <p className="mt-3 max-w-2xl text-sm text-(--text-secondary) sm:text-base">
                Track your net worth, realized movement, and the strength of each position from a single view.
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <p className="text-green-300">Available balance</p>
              <p className="mt-1 text-2xl font-semibold">
                {balance !== null ? formatCurrency(balance) : "—"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Couldn't reach the server — showing demo data.
              <button onClick={fetchPortfolio} className="ml-auto flex items-center gap-1 font-medium hover:underline">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
        </motion.section>

        {/* 5. Summary Cards with new optional chaining properties */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <p className="text-sm text-(--text-secondary)">Invested</p>
            <p className="mt-3 text-2xl font-semibold">
              {isLoading ? "—" : formatCurrency(summary?.totalInvested)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-(--text-secondary)">Current value</p>
            <p className="mt-3 text-2xl font-semibold">
              {isLoading ? "—" : formatCurrency(summary?.currentValue)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-(--text-secondary)">P/L</p>
            <p
              className={`mt-3 text-2xl font-semibold ${
                summary?.totalUnrealizedPL >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {isLoading
                ? "—"
                : `${summary?.totalUnrealizedPL >= 0 ? "+" : ""}${formatCurrency(summary?.totalUnrealizedPL)} · ${formatPercent(summary?.totalReturnPercent)}`}
            </p>
          </Card>
        </div>

        {/* 6. Holdings Table with nested stockId mapping */}
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current holdings</h2>
              <p className="text-sm text-(--text-secondary)">
                {isLoading
                  ? "Loading your positions…"
                  : holdings.length > 0
                  ? "A balanced mix of quality and momentum names"
                  : "You don't hold any positions yet"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-(--border-color) bg-(--surface-2) px-3 py-2 text-sm text-(--text-secondary)">
              <Wallet size={16} className="text-green-400" />
              {isLoading ? "…" : `${holdings.length} active position${holdings.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {!isLoading && holdings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--border-color) p-10 text-center text-sm text-(--text-secondary)">
              No holdings yet — place your first order to see it here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-(--text-secondary)">
                  <tr>
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium">Qty</th>
                    <th className="pb-3 font-medium">Avg cost</th>
                    <th className="pb-3 font-medium">LTP</th>
                    <th className="pb-3 font-medium">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-t border-(--border-color)">
                          <td colSpan={5} className="py-4">
                            <div className="h-4 w-full animate-pulse rounded bg-(--surface-2)" />
                          </td>
                        </tr>
                      ))
                    : holdings.map((holding) => (
                        <tr key={holding.stockId?.symbol} className="border-t border-(--border-color)">
                          <td className="py-4 font-medium">{holding.stockId?.symbol}</td>
                          <td className="py-4">{holding.quantity}</td>
                          <td className="py-4">{formatCurrency(holding.avgBuyPrice)}</td>
                          <td className="py-4">{formatCurrency(holding.stockId?.currentPrice)}</td>
                          <td
                            className={`py-4 font-semibold ${
                              holding.unrealizedPL >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {holding.unrealizedPL >= 0 ? "+" : ""}
                            {formatCurrency(holding.unrealizedPL)} ({formatPercent(holding.unrealizedPLPercent)})
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Next move</h2>
              <p className="mt-1 text-sm text-(--text-secondary)">
                Stay aligned with your strategy and rebalance when needed.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400">
              Review plan <ArrowUpRight size={16} />
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}