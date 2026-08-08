import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from "lucide-react";

export default function MarketHeader({
  onSearch,
  marketStatus = "OPEN",
  stats = {},
}) {
  const fmt = (n) =>
    typeof n === "number" && isFinite(n) ? n.toLocaleString("en-IN") : n;

  const volumeCr = stats.volume
    ? `₹${(stats.volume / 10000000000).toFixed(2)}L Cr`
    : "—";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-7 shadow-lg">

      {/* Background Glow */}

      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-24 left-0 h-52 w-52 rounded-full bg-green-500/10 blur-3xl" />

      <div className="relative">

        {/* Top */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-4xl font-bold">
                Market
              </h1>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  marketStatus === "OPEN"
                    ? "bg-green-500/15 text-green-500"
                    : "bg-red-500/15 text-red-500"
                }`}
              >
                {marketStatus}
              </div>

            </div>

            <p className="mt-3 max-w-xl text-(--text-secondary)">
              Explore all NSE & BSE listed companies, monitor market
              performance and discover trading opportunities.
            </p>

          </div>

          <button
            onClick={onSearch}
            className="flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-1) px-5 py-3 transition hover:bg-(--surface-2)"
          >
            <Search size={18} />
            Search Stocks
          </button>

        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-(--text-secondary)">
                Listed Stocks
              </p>

              <BarChart3 size={18} className="text-blue-500" />

            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {fmt(stats.listed) || "5000+"}
            </h2>

          </div>

          <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-(--text-secondary)">
                Top Gainers
              </p>

              <TrendingUp size={18} className="text-green-500" />

            </div>

            <h2 className="mt-4 text-3xl font-bold text-green-500">
              {fmt(stats.gainers) ?? "+178"}
            </h2>

          </div>

          <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-(--text-secondary)">
                Top Losers
              </p>

              <TrendingDown size={18} className="text-red-500" />

            </div>

            <h2 className="mt-4 text-3xl font-bold text-red-500">
              {fmt(stats.losers) ?? "-132"}
            </h2>

          </div>

          <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-(--text-secondary)">
                Market Volume
              </p>

              <Activity size={18} className="text-purple-500" />

            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {volumeCr}
            </h2>

          </div>

        </div>

      </div>

    </div>
  );
}