import { marketIndices } from "../constants/Marketdata.js";

export default function MarketIndices() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">
          Market Overview
        </h2>

        <button className="text-green-400 hover:text-green-300 transition">
          View All →
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">

        {marketIndices.map((item) => (
          <div
            key={item.id}
            className="min-w-[240px] bg-[#121212] border border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-green-500 hover:-translate-y-1 transition-all duration-300"
          >
            <h3 className="text-sm text-gray-400">
              {item.symbol}
            </h3>

            <h1 className="text-3xl font-bold mt-3">
              {item.value}
            </h1>

            <p
              className={`mt-4 font-semibold ${
                item.positive
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {item.change > 0 ? "+" : ""}
              {item.change} ({item.percent}%)
            </p>
          </div>
        ))}

      </div>
    </section>
  );
}