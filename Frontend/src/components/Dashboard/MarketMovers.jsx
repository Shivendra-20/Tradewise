import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStocks } from "../../api/stock.js";
import { useLiveQuote, subscribeSymbols } from "../../lib/realtime.js";

function MoverRow({ stock, index }) {
  const navigate = useNavigate();
  const live = useLiveQuote(stock.symbol);

  const fallbackPrice = typeof stock.currentPrice === "number" ? stock.currentPrice : 0;
  const price = live?.price ?? fallbackPrice;
  const changePercent = live?.changePercent ?? stock.changePercent ?? 0;
  const change = live?.change ?? stock.change ?? 0;

  return (
    <button
      onClick={() => navigate(`/stock/${stock.symbol}`)}
      className="flex w-full items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 text-left transition-all duration-200 hover:scale-[1.01] hover:border-blue-500/30"
    >
      <div className="flex items-center gap-4">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
          #{index + 1}
        </div>

        <div>
          <h3 className="font-semibold text-(--text-primary)">
            {stock.symbol}
          </h3>

          <p className="mt-1 text-sm text-(--text-secondary)">
            {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "—"}
          </p>
        </div>

      </div>

      <div className="text-right">

        <p
          className={`font-semibold ${
            changePercent >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
        </p>

        <p className="mt-1 text-xs text-(--text-secondary)">
          {change >= 0 ? "+" : ""}₹{Math.abs(change).toFixed(2)}
        </p>

      </div>
    </button>
  );
}

export default function MarketMovers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("gainers");
  const [movers, setMovers] = useState({ gainers: [], losers: [], active: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const loadMovers = async () => {
    try {
      setError(false);
      const res = await getStocks({ limit: 500, live: 1 });
      const list = res?.data?.stocks || [];

      if (list.length > 0) {
        const byChange = (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0);
        const byVolume = (a, b) => (b.volume ?? 0) - (a.volume ?? 0);

        setMovers({
          gainers: [...list].sort(byChange).slice(0, 5),
          losers: [...list].sort(byChange).reverse().slice(0, 5),
          active: [...list].sort(byVolume).slice(0, 5),
        });
      }
    } catch (err) {
      console.error("Failed to load movers:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    loadMovers();
    const id = setInterval(loadMovers, 60000);
    return () => clearInterval(id);
  }, []);

  const data = movers[activeTab] || [];

  useEffect(() => {
    const symbols = [...movers.gainers, ...movers.losers, ...movers.active].map((s) => s.symbol);
    if (symbols.length) subscribeSymbols(symbols);
  }, [movers]);

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

          <button
            onClick={loadMovers}
            title="Refresh movers"
            className="flex items-center gap-2 rounded-xl border border-(--border-color) px-3 py-2 text-sm font-medium text-(--text-secondary) transition hover:bg-(--surface-2)"
          >
            <RefreshCw size={15} />
          </button>
        </div>

      </div>

      {/* Stocks */}

      <div className="space-y-3">

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-(--border-color) bg-(--surface-2)" />
            ))}
          </div>
        )}

        {!loading && data.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-(--text-secondary)">
            No movers available right now.
          </p>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-(--text-secondary)">
              Couldn't load market movers.
            </p>
            <button
              onClick={loadMovers}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data.map((stock, index) => (
          <MoverRow
            key={stock.symbol}
            stock={stock}
            index={index}
          />
        ))}

      </div>

      <div className="mt-5">
        <button
          onClick={() => navigate("/markets")}
          className="text-sm font-medium text-blue-500 hover:underline"
        >
          View full market →
        </button>
      </div>

    </section>
  );
}
