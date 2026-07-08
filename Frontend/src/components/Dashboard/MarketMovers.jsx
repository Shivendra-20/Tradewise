import { useState } from "react";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";
import { gainers, losers } from "../constants/Marketmovers.js";

export default function MarketMovers() {
  const [activeTab, setActiveTab] = useState("gainers");

  const tabs = [
    {
      id: "gainers",
      label: "Top Gainers",
      icon: TrendingUp,
    },
    {
      id: "losers",
      label: "Top Losers",
      icon: TrendingDown,
    },
    {
      id: "active",
      label: "Most Active",
      icon: Activity,
    },
  ];

  const data =
    activeTab === "gainers"
      ? gainers
      : activeTab === "losers"
      ? losers
      : gainers;

  return (
    <section className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6 shadow-(--shadow-card)">

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="text-xl font-semibold">
            Market Movers
          </h2>

          <p className="mt-1 text-sm text-(--text-secondary)">
            Biggest gainers, losers and actively traded stocks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-(--surface-2) text-(--text-secondary) hover:bg-(--surface-2)"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Stocks */}

      <div className="space-y-3">

        {data.map((stock, index) => (
          <div
            key={stock.symbol}
            className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                #{index + 1}
              </div>

              <div>
                <h3 className="font-semibold">
                  {stock.symbol}
                </h3>

                <p className="mt-1 text-sm text-(--text-secondary)">
                  ₹{stock.price}
                </p>
              </div>

            </div>

            <div className="text-right">

              <p
                className={`font-semibold ${
                  activeTab === "losers"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {stock.change}
              </p>

              <p className="mt-1 text-xs text-(--text-secondary)">
                Today
              </p>

            </div>
          </div>
        ))}

      </div>

    </section>
  );
}