import { TrendingUp, TrendingDown } from "lucide-react";
import { gainers, losers } from "../constants/Marketmovers.js";

export default function MarketMovers({ type }) {
  const data = type === "gainers" ? gainers : losers;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

      <div className="flex items-center gap-2 mb-6">

        {type === "gainers" ? (
          <TrendingUp className="text-green-400" />
        ) : (
          <TrendingDown className="text-red-400" />
        )}

        <h2 className="text-xl font-bold">
          {type === "gainers"
            ? "Top Gainers"
            : "Top Losers"}
        </h2>

      </div>

      <div className="space-y-4">

        {data.map((stock) => (
          <div
            key={stock.symbol}
            className="flex justify-between items-center p-4 rounded-2xl hover:bg-zinc-800 transition"
          >
            <div>
              <h3 className="font-semibold">
                {stock.symbol}
              </h3>

              <p className="text-gray-400 text-sm">
                {stock.price}
              </p>
            </div>

            <span
              className={`font-semibold ${
                type === "gainers"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {stock.change}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
}