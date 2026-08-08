import {
  Building2,
  BarChart3,
  TrendingUp,
} from "lucide-react";

function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-4">
      <p className="text-xs text-(--text-secondary)">
        {title}
      </p>

      <h4 className="mt-2 text-lg font-semibold text-(--text-primary)">
        {value}
      </h4>
    </div>
  );
}

const formatCr = (value) =>
  typeof value === "number" && value > 0
    ? `₹${(value / 10000000).toFixed(2)} Cr`
    : "—";

const formatINR = (value) =>
  typeof value === "number" && value > 0
    ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "—";

const formatRatio = (value) =>
  typeof value === "number" && value > 0
    ? value.toFixed(2)
    : "—";

const formatPercent = (value) =>
  typeof value === "number"
    ? `${(value * 100).toFixed(2)}%`
    : "—";

export default function StockFundamentals({ stock }) {
  const f = stock?.fundamentals ?? {};

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-6 shadow-lg">

      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
          <BarChart3 size={20} />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            Fundamentals
          </h2>

          <p className="text-sm text-(--text-secondary)">
            Important company metrics
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Metric
          title="Market Cap"
          value={formatCr(f.marketCap ?? stock?.marketCap)}
        />

        <Metric
          title="P/E Ratio"
          value={formatRatio(f.peRatio)}
        />

        <Metric
          title="P/B Ratio"
          value={formatRatio(f.priceToBook)}
        />

        <Metric
          title="Dividend Yield"
          value={formatPercent(f.dividendYield)}
        />

        <Metric
          title="EPS"
          value={formatINR(f.eps)}
        />

        <Metric
          title="ROE"
          value={formatPercent(f.roe)}
        />

        <Metric
          title="ROCE"
          value={f.roce ? formatPercent(f.roce) : "—"}
        />

        <Metric
          title="Book Value"
          value={formatINR(f.bookValue)}
        />

      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">

        <div className="rounded-2xl bg-(--surface-1) p-5">

          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-blue-500" />
            <h3 className="font-semibold">
              Company
            </h3>
          </div>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Sector
              </span>

              <span>{stock?.sector || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Industry
              </span>

              <span>{stock?.industry || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Exchange
              </span>

              <span>{stock?.exchange || "—"}</span>
            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-(--surface-1) p-5">

          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            <h3 className="font-semibold">
              Performance
            </h3>
          </div>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                52W High
              </span>

              <span>{formatINR(stock?.weekHigh52)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                52W Low
              </span>

              <span>{formatINR(stock?.weekLow52)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Day Range
              </span>

              <span>
                {stock?.dayLow > 0 || stock?.dayHigh > 0
                  ? `${formatINR(stock.dayLow)} – ${formatINR(stock.dayHigh)}`
                  : "—"}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
