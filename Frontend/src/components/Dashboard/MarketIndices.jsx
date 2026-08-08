import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from "lucide-react";
import { marketIndices as STATIC_INDICES } from "../constants/Marketdata.js";
import { useLiveQuote, subscribeSymbols } from "../../lib/realtime.js";
import { getIndicesQuotes } from "../../api/stock.js";
import { getMarketStatus } from "../../lib/marketTime.js";

function IndexCard({ item }) {
  const navigate = useNavigate();

  const live = useLiveQuote(item.stockSymbol);

  const value = live?.price ?? item.price;
  const change = live?.change ?? item.change;
  const percent = live?.changePercent ?? item.percent;
  const positive = (percent ?? 0) >= 0;

  return (
    <button
      onClick={() => navigate(`/stock/${item.stockSymbol}`)}
      className="group rounded-3xl border border-(--border-color) bg-(--surface-1) p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-(--text-secondary)">{item.symbol}</p>
          <h2 className="mt-4 text-3xl font-bold text-(--text-primary)">
            {typeof value === "number"
              ? `₹${value.toLocaleString("en-IN")}`
              : "—"}
          </h2>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${positive ? "bg-green-500/10" : "bg-red-500/10"}`}>
          {positive ? <TrendingUp className="text-green-500" size={22} /> : <TrendingDown className="text-red-500" size={22} />}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className={`text-base font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
            {positive && change > 0 ? "+" : ""}{typeof change === "number" ? change.toFixed(2) : "—"}
          </p>
          <p className={`mt-1 text-sm ${positive ? "text-green-500" : "text-red-500"}`}>
            {positive && percent > 0 ? "+" : ""}{typeof percent === "number" ? percent.toFixed(2) : "—"}%
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-(--text-secondary) transition group-hover:text-blue-500">
          View
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

export default function MarketIndices() {
  const [liveIndices, setLiveIndices] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadIndices = async () => {
    try {
      const res = await getIndicesQuotes();
      if (res?.data?.success && Array.isArray(res.data.indices)) {
        setLiveIndices(res.data.indices);
      }
    } catch (err) {
      console.error("Failed to load indices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    subscribeSymbols(STATIC_INDICES.map((item) => item.stockSymbol));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    loadIndices();
    const id = setInterval(loadIndices, 20000);
    return () => clearInterval(id);
  }, []);

  // Merge live quotes over the static labels; fall back to static when the
  // API is unreachable so the section never looks broken.
  const items = (liveIndices && liveIndices.length > 0 ? liveIndices : STATIC_INDICES).map((q) => {
    const label = STATIC_INDICES.find((s) => s.stockSymbol === q.symbol);
    return {
      id: q.symbol,
      symbol: q.label ?? label?.symbol ?? q.symbol,
      stockSymbol: q.symbol,
      price: q.price,
      change: q.change ?? 0,
      percent: q.changePercent ?? 0,
    };
  });

  const marketOpen = getMarketStatus() === "OPEN";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-(--text-primary)">Market Indices</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">Track the major Indian benchmark indices in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
              marketOpen
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  marketOpen ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
            </span>

            <span className={`text-sm font-semibold ${marketOpen ? "text-green-500" : "text-red-500"}`}>
              {marketOpen ? "Market Open" : "Market Closed"}
            </span>
          </div>

          <button
            onClick={loadIndices}
            title="Refresh indices"
            className="rounded-full border border-(--border-color) bg-(--surface-1) p-2.5 text-(--text-secondary) transition hover:bg-(--surface-2)"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <IndexCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
