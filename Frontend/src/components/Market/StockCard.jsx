import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Star,
} from "lucide-react";

export default function StockCard({
  stock,
  onWatchlist,
}) {
  const navigate = useNavigate();

  const positive = stock?.change >= 0;

  return (
    <div
      onClick={() => navigate(`/stock/${stock.symbol}`)}
      className="group cursor-pointer rounded-2xl border border-(--border-color) bg-(--bg-secondary) p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl"
    >
      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

         <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            {stock.logo || stock.symbol.slice(0, 2)}
          </div>

          <div>

           <h3 className="text-sm font-semibold text-(--text-primary) line-clamp-1">
              {stock.companyName}
            </h3>

            <p className="text-xs text-(--text-secondary)">
              {stock.symbol}
            </p>

          </div>

        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onWatchlist?.(stock);
          }}
          className="rounded-xl p-2 transition hover:bg-(--surface-1)"
        >
          <Star
            size={18}
            className={
              stock.watchlisted
                ? "fill-yellow-400 text-yellow-400"
                : "text-(--text-secondary)"
            }
          />
        </button>

      </div>

      {/* Price */}

      <div className="mt-4">

       <h2 className="text-2xl font-bold">
          ₹{stock.price.toLocaleString()}
        </h2>

        <div
          className={`mt-2 flex items-center gap-2 text-sm font-medium ${
            positive
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {positive ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}

          {positive ? "+" : ""}
          {stock.change}

          <span>
            ({positive ? "+" : ""}
            {stock.changePercent}%)
          </span>

        </div>

      </div>


      {/* Stats */}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="rounded-lg bg-(--surface-1) p-2.5">

          <p className="text-xs text-(--text-secondary)">
            Market Cap
          </p>

          <p className="mt-1 font-semibold">
            {stock.marketCap}
          </p>

        </div>

        <div className="rounded-xl bg-(--surface-1) p-3">

          <p className="text-xs text-(--text-secondary)">
            Sector
          </p>

          <p className="mt-1 font-semibold">
            {stock.sector}
          </p>

        </div>

      </div>

      {/* Footer */}

   <div className="mt-4 flex gap-2">

        
      </div>

    </div>
  );
}