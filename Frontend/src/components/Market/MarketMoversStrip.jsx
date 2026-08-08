import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const TABS = [
  { id: "gainers", label: "Top Gainers", icon: TrendingUp, color: "text-green-500" },
  { id: "losers", label: "Top Losers", icon: TrendingDown, color: "text-red-500" },
  { id: "active", label: "Most Active", icon: Activity, color: "text-blue-500" },
];

export default function MarketMoversStrip({ movers = {} }) {
  const [tab, setTab] = useState("gainers");
  const navigate = useNavigate();

  const list =
    tab === "losers" ? movers.losers || [] : tab === "active" ? movers.active || [] : movers.gainers || [];

  return (
    <section className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Market Movers</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Live movers from the current market snapshot.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  tab === t.id
                    ? "bg-blue-500 text-white"
                    : "bg-(--surface-2) text-(--text-secondary) hover:bg-(--surface-2)"
                }`}
              >
                <Icon size={16} className={tab === t.id ? "" : t.color} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-(--text-secondary)">Loading movers…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {list.map((stock, index) => {
            const positive = (stock.changePercent ?? 0) >= 0;
            return (
              <button
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="group rounded-2xl border border-(--border-color) bg-(--surface-2) p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-green-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--text-secondary)">#{index + 1}</span>
                  {positive ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                </div>

                <h3 className="mt-2 font-semibold">{stock.symbol}</h3>
                <p className="mt-1 text-sm text-(--text-secondary)">
                  ₹{(stock.currentPrice ?? stock.price ?? 0).toLocaleString("en-IN")}
                </p>

                <p className={`mt-2 text-sm font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
                  {positive ? "+" : ""}{(stock.changePercent ?? 0).toFixed(2)}%
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
