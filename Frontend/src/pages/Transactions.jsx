import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import api from "../api/axios.js";
import { formatCurrency } from "../lib/formatters.js";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError(false);

      const res = await api.get("/transaction");

      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const symbol = tx.stockId?.symbol?.toLowerCase() || "";
      const name = tx.stockId?.name?.toLowerCase() || "";

      const matchSearch =
        symbol.includes(search.toLowerCase()) ||
        name.includes(search.toLowerCase());

      if (filter === "All") return matchSearch;

      return (
        tx.action?.toLowerCase() === filter.toLowerCase() &&
        matchSearch
      );
    });
  }, [transactions, search, filter]);

  const summary = useMemo(() => {
    let buyValue = 0;
    let sellValue = 0;
    let totalProfit = 0;

    filteredTransactions.forEach((tx) => {
      const value = tx.quantity * tx.price;

      if (tx.action === "buy") {
        buyValue += value;
      } else {
        sellValue += value;
      }

      totalProfit += tx.profitLoss || 0;
    });

    return {
      total: filteredTransactions.length,
      buyValue,
      sellValue,
      totalProfit,
    };
  }, [filteredTransactions]);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-(--border-color) bg-gradient-to-br from-(--bg-secondary) via-(--bg-secondary) to-green-950/30 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-sm text-(--text-secondary)">
                Transaction History
              </p>

              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Complete Trading Activity
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-(--text-secondary)">
                Review every buy and sell transaction along with your
                balance changes and realized profit/loss.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
              <Wallet size={16} />
              {loading
                ? "..."
                : `${summary.total} Transaction${
                    summary.total !== 1 ? "s" : ""
                  }`}
            </div>

          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              Failed to load transactions.

              <button
                onClick={fetchTransactions}
                className="ml-auto flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          )}
        </motion.section>

        {/* Summary */}

        <div className="grid gap-5 md:grid-cols-4">

          <Card>
            <p className="text-sm text-(--text-secondary)">
              Total Transactions
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {loading ? "--" : summary.total}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-(--text-secondary)">
              Total Buy Value
            </p>

            <p className="mt-3 text-2xl font-semibold text-green-400">
              {loading
                ? "--"
                : formatCurrency(summary.buyValue)}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-(--text-secondary)">
              Total Sell Value
            </p>

            <p className="mt-3 text-2xl font-semibold text-blue-400">
              {loading
                ? "--"
                : formatCurrency(summary.sellValue)}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-(--text-secondary)">
              Net Profit / Loss
            </p>

            <p
              className={`mt-3 text-2xl font-semibold ${
                summary.totalProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {loading
                ? "--"
                : formatCurrency(summary.totalProfit)}
            </p>
          </Card>

        </div>

        {/* Search + Filter */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex rounded-xl bg-(--surface-2) p-1">

            {["All", "Buy", "Sell"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  filter === item
                    ? "bg-green-500 text-black"
                    : "text-(--text-secondary)"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

          <div className="relative w-full md:w-80">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company..."
              className="w-full rounded-xl border border-(--border-color) bg-(--surface-1) py-2 pl-10 pr-4 outline-none"
            />

          </div>

        </div>

        <Card>
                    {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-(--surface-2)"
                />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--border-color) p-10 text-center text-(--text-secondary)">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-(--text-secondary)">
                  <tr className="border-b border-(--border-color)">
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">P/L</th>
                    <th className="pb-3 text-right">Balance</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((tx) => {
                    const total = tx.quantity * tx.price;
                    const profit = tx.profitLoss ?? 0;
                    const positive = profit >= 0;

                    return (
                      <tr
                        key={tx._id}
                        className="border-b border-(--border-color) hover:bg-(--surface-2)/50 transition"
                      >
                        {/* Stock */}
                        <td className="py-4">
                          <div className="font-semibold">
                            {tx.stockId?.symbol}
                          </div>

                          <div className="text-xs text-(--text-secondary)">
                            {tx.stockId?.name}
                          </div>
                        </td>

                        {/* Buy / Sell */}
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              tx.action === "buy"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {tx.action === "buy" ? (
                              <ArrowDownLeft size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}

                            {tx.action.toUpperCase()}
                          </span>
                        </td>

                        {/* Qty */}
                        <td className="py-4 text-right">
                          {tx.quantity}
                        </td>

                        {/* Price */}
                        <td className="py-4 text-right">
                          {formatCurrency(tx.price)}
                        </td>

                        {/* Total */}
                        <td className="py-4 text-right font-medium">
                          {formatCurrency(total)}
                        </td>

                        {/* Profit */}
                        <td
                          className={`py-4 text-right font-semibold ${
                            positive
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {formatCurrency(profit)}
                        </td>

                        {/* Balance */}
                        <td className="py-4 text-right">
                          {formatCurrency(tx.balanceAfter)}
                        </td>

                        {/* Date */}
                        <td className="py-4 whitespace-nowrap text-(--text-secondary)">
                          {new Date(tx.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}