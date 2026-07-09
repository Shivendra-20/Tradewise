import {
  Building2,
  BarChart3,
  TrendingUp,
  Percent,
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

export default function StockFundamentals({ stock }) {
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
          value={stock?.marketCap || "₹18.35 L Cr"}
        />

        <Metric
          title="P/E Ratio"
          value={stock?.pe || "28.64"}
        />

        <Metric
          title="P/B Ratio"
          value={stock?.pb || "2.15"}
        />

        <Metric
          title="Dividend Yield"
          value={stock?.dividendYield || "0.42%"}
        />

        <Metric
          title="EPS"
          value={stock?.eps || "₹94.30"}
        />

        <Metric
          title="ROE"
          value={stock?.roe || "18.60%"}
        />

        <Metric
          title="ROCE"
          value={stock?.roce || "21.75%"}
        />

        <Metric
          title="Book Value"
          value={stock?.bookValue || "₹1152.40"}
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

              <span>{stock?.sector || "Energy"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Industry
              </span>

              <span>{stock?.industry || "Oil & Gas"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Exchange
              </span>

              <span>{stock?.exchange || "NSE"}</span>
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

              <span>{stock?.high52 || "₹2,745"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                52W Low
              </span>

              <span>{stock?.low52 || "₹2,120"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-(--text-secondary)">
                Face Value
              </span>

              <span>{stock?.faceValue || "₹10"}</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}