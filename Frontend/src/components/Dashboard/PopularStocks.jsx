import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { popularStocks } from "../constants/PopularStocks.js";

export default function PopularStocks() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-(--text-primary)">
            Popular Stocks
          </h2>

          <p className="mt-1 text-sm text-(--text-secondary)">
            Most traded stocks in today's market.
          </p>
        </div>

        <button className="rounded-xl border border-(--border-color) bg-(--surface-1) px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-(--surface-2)">
          View All
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {popularStocks.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className="group rounded-3xl border border-(--border-color) bg-(--surface-1) p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl"
          >
            {/* Header */}

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                {/* Placeholder Logo */}
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
                {stock.price}
              </h2>

              <p
                className={`mt-2 font-semibold ${
                  stock.positive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stock.change}
              </p>

            </div>

            {/* Sparkline Placeholder */}

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-(--surface-2)">

              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stock.positive
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${72 + Math.random() * 20}%`,
                }}
              />

            </div>

            {/* Footer */}

            <div className="mt-5 flex items-center justify-between">

              <span className="text-xs text-(--text-secondary)">
                NSE
              </span>

              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                Trade
              </span>

            </div>

          </button>
        ))}
      </div>
    </section>
  );
}