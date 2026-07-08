import { useNavigate } from "react-router-dom";
import { marketIndices } from "../constants/Marketdata.js";
import MiniChart from "./MiniChart.jsx";

export default function MarketTiles() {
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Market Pulse</h2>
          <p className="text-sm text-(--text-secondary)">A sharper snapshot of the market movers you care about</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {marketIndices.map((market) => (
          <button
            key={market.id}
            type="button"
            onClick={() => navigate(`/stock/${market.stockSymbol}`)}
            className="group rounded-3xl border border-(--border-color) bg-(--surface-1) p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-green-500"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-(--text-secondary)">{market.symbol}</h3>
              <span className="rounded-full bg-green-500/10 px-2 py-1 text-[11px] text-green-400">
                {market.status}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold">{market.value}</h1>
            <p className={`mt-2 font-medium ${market.positive ? "text-green-400" : "text-red-400"}`}>
              {market.change} ({market.percent})
            </p>
            <MiniChart positive={market.positive} />
          </button>
        ))}
      </div>
    </section>
  );
}