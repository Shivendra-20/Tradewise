import {
  ArrowUp,
  ArrowDown,
  BarChart3,
  Activity,
  Clock3,
  IndianRupee,
} from "lucide-react";
import { useLiveQuote } from "../../lib/realtime.js";

export default function StockStats({ stock }) {
  const live = useLiveQuote(stock?.symbol);

  const fmt = (value) =>
    typeof value === "number" && value > 0 ? `₹${value.toLocaleString("en-IN")}` : "—";

  const open = live?.open ?? stock?.open;
  const high = live?.high ?? stock?.high;
  const low = live?.low ?? stock?.low;
  const previousClose = live?.previousClose ?? stock?.previousClose;
  const volume = live?.volume ?? stock?.volume;

  const stats = [
    {
      title: "Open",
      value: fmt(open),
      icon: ArrowUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "High",
      value: fmt(high),
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Low",
      value: fmt(low),
      icon: ArrowDown,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Prev Close",
      value: fmt(previousClose),
      icon: Clock3,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Volume",
      value:
        typeof volume === "number" && volume > 0
          ? volume.toLocaleString("en-IN")
          : "—",
      icon: BarChart3,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Market Cap",
      value:
        typeof stock?.marketCap === "number" && stock.marketCap > 0
          ? `₹${(stock.marketCap / 10000000).toFixed(2)} Cr`
          : "—",
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {item.title}
                </p>

                <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {item.value}
                </h3>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}
              >
                <Icon className={item.color} size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}