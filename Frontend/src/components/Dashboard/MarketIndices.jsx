import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { marketIndices } from "../constants/Marketdata.js";

export default function MarketIndices() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-(--text-primary)">
            Market Indices
          </h2>

          <p className="mt-1 text-sm text-(--text-secondary)">
            Track the major Indian benchmark indices in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </span>

          <span className="text-sm font-semibold text-green-500">
            Market Open
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {marketIndices.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/stock/${item.stockSymbol}`)}
            className="group rounded-3xl border border-(--border-color) bg-(--surface-1) p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl"
          >
            {/* Top */}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-(--text-secondary)">
                  {item.symbol}
                </p>

                <h2 className="mt-4 text-3xl font-bold text-(--text-primary)">
                  {item.value}
                </h2>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  item.positive
                    ? "bg-green-500/10"
                    : "bg-red-500/10"
                }`}
              >
                {item.positive ? (
                  <TrendingUp className="text-green-500" size={22} />
                ) : (
                  <TrendingDown className="text-red-500" size={22} />
                )}
              </div>
            </div>

            {/* Bottom */}

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p
                  className={`text-base font-semibold ${
                    item.positive
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {item.change}
                </p>

                <p
                  className={`mt-1 text-sm ${
                    item.positive
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {item.percent}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-(--text-secondary) transition group-hover:text-blue-500">
                View
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}