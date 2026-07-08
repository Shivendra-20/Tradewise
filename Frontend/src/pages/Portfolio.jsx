import { motion } from "framer-motion";
import { ArrowUpRight, Wallet } from "lucide-react";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import { formatCurrency, formatPercent } from "../lib/formatters.js";

const holdings = [
  { symbol: "RELIANCE", quantity: 12, avgPrice: 1586.4, currentPrice: 1586.4, pnl: 540 },
  { symbol: "TCS", quantity: 8, avgPrice: 3982.2, currentPrice: 4028.5, pnl: 370 },
  { symbol: "INFY", quantity: 15, avgPrice: 1742.5, currentPrice: 1718.6, pnl: -360 },
];

export default function Portfolio() {
  const summary = {
    invested: 54600,
    currentValue: 56860,
    pnl: 2260,
    returnPercent: 4.14,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-gray-400">Portfolio overview</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your paper trading performance</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Track your net worth, realized movement, and the strength of each position from a single view.
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <p className="text-green-300">Available balance</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(76350)}</p>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-400">Invested</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(summary.invested)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-400">Current value</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(summary.currentValue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-400">P/L</p>
            <p className={`mt-3 text-2xl font-semibold ${summary.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {summary.pnl >= 0 ? "+" : ""}{formatCurrency(summary.pnl)} · {formatPercent(summary.returnPercent)}
            </p>
          </Card>
        </div>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current holdings</h2>
              <p className="text-sm text-gray-400">A balanced mix of quality and momentum names</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-gray-300">
              <Wallet size={16} className="text-green-400" />
              3 active positions
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Qty</th>
                  <th className="pb-3 font-medium">Avg cost</th>
                  <th className="pb-3 font-medium">LTP</th>
                  <th className="pb-3 font-medium">P/L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="border-t border-zinc-800/80">
                    <td className="py-4 font-medium">{holding.symbol}</td>
                    <td className="py-4">{holding.quantity}</td>
                    <td className="py-4">{formatCurrency(holding.avgPrice)}</td>
                    <td className="py-4">{formatCurrency(holding.currentPrice)}</td>
                    <td className={`py-4 font-semibold ${holding.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {holding.pnl >= 0 ? "+" : ""}{formatCurrency(holding.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Next move</h2>
              <p className="mt-1 text-sm text-gray-400">Stay aligned with your strategy and rebalance when needed.</p>
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