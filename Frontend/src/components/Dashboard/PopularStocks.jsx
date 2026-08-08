import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { popularStocks as fallbackStocks } from "../constants/PopularStocks.js";
import { getStocks } from "../../api/stock.js";
import { useLiveQuote, subscribeSymbols } from "../../lib/realtime.js";

// Curated liquid NSE names kept in sync with the backend popular list.
const POPULAR_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "ICICIBANK",
  "INFY",
  "SBIN",
  "BHARTIARTL",
  "ITC",
];

function PopularStockCard({ stock }) {
  const navigate = useNavigate();
  const live = useLiveQuote(stock.symbol);

  const sparkWidth = 72 + (stock.symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 21);

  const price = live?.price ?? stock.currentPrice ?? stock.price;
  const change = live?.changePercent ?? live?.change ?? stock.changePercent ?? stock.change ?? 0;
  const positive = change >= 0;

  return (
    <button
      onClick={() => navigate(`/stock/${stock.symbol}`)}
      className="group rounded-3xl border border-(--border-color) bg-(--surface-1) p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl"
    >
      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 font-bold text-blue-500">
            {stock.symbol.slice(0, 1)}
          </div>

          <div>
            <h3 className="font-semibold text-(--text-primary)">
              {stock.symbol}
            </h3>

            <p className="text-xs text-(--text-secondary)">
              {stock.name}
            </p>
          </div>

        </div>

        <ArrowUpRight
          size={18}
          className="text-(--text-secondary) transition group-hover:translate-x-1 group-hover:text-blue-500"
        />
      </div>

      {/* Price */}

      <div className="mt-8">
        <h2 className="text-3xl font-bold text-(--text-primary)">
          {typeof price === "number" && price > 0
            ? `₹${price.toLocaleString("en-IN")}`
            : "—"}
        </h2>

        <p className={`mt-2 font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
          {positive && change > 0 ? "+" : ""}{typeof change === "number" ? change.toFixed(2) : ""}%
        </p>
      </div>

      {/* Sparkline Placeholder */}

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-(--surface-2)">

        <div
          className={`h-full rounded-full transition-all duration-500 ${
            positive ? "bg-green-500" : "bg-red-500"
          }`}
          style={{
            width: `${sparkWidth}%`,
          }}
        />

      </div>

      {/* Footer */}

      <div className="mt-5 flex items-center justify-between">

        <span className="text-xs text-(--text-secondary)">
          {stock.exchange || "NSE"}
        </span>

        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
          Trade
        </span>

      </div>

    </button>
  );
}

export default function PopularStocks() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadPopularStocks = async () => {
      try {
        const response = await getStocks({
          symbols: POPULAR_SYMBOLS.join(","),
          limit: 50,
          live: 1,
        });
        if (mounted && response?.data?.success && Array.isArray(response.data.stocks)) {
          const list = response.data.stocks;
          const ordered = POPULAR_SYMBOLS
            .map((symbol) => list.find((s) => s.symbol === symbol))
            .filter(Boolean);
          setStocks(ordered);
        }
      } catch (err) {
        console.error("Popular stocks load failed:", err);
        if (mounted) {
          setStocks(fallbackStocks.slice(0, 8));
        }
      }
    };

    loadPopularStocks();
    return () => {
      mounted = false;
    };
  }, []);

  const renderedStocks = stocks.length ? stocks : fallbackStocks.slice(0, 8);

  useEffect(() => {
    subscribeSymbols(renderedStocks.map((s) => s.symbol));
  }, [renderedStocks]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-(--text-primary)">
            Popular Stocks
          </h2>

          <p className="text-xs text-[var(--text-secondary)]">
            Most traded stocks in today's market.
          </p>
        </div>

        <button
          className="rounded-xl border border-(--border-color) bg-(--surface-1) px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-(--surface-2)"
          onClick={() => navigate("/markets")}
        >
          View All
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {renderedStocks.map((stock) => (
          <PopularStockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </section>
  );
}
