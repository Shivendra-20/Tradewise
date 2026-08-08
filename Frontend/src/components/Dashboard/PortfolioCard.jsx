import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  IndianRupee,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

const fmtINR = (n) =>
  typeof n === "number" && isFinite(n)
    ? `₹${Math.round(n).toLocaleString("en-IN")}`
    : "—";

const fmtSigned = (n) =>
  typeof n === "number" && isFinite(n)
    ? `${n >= 0 ? "+₹" : "-₹"}${Math.abs(Math.round(n)).toLocaleString("en-IN")}`
    : "—";

export default function PortfolioCard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const loadPortfolio = async () => {
    try {
      setError(false);
      const res = await api.get("/api/portfolio");
      setData(res.data);
    } catch (err) {
      console.error("Portfolio load failed:", err);
      setError(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    loadPortfolio();
  }, []);

  const summary = data?.summary;
  const balance = data?.user?.balance;
  const pl = summary?.totalUnrealizedPL;
  const plPercent = summary?.totalReturnPercent;
  const positive = (pl ?? 0) >= 0;
  const holdingsCount = summary?.holdingsCount ?? 0;
  const netWorth = summary?.totalNetWorth;
  const loaded = data !== null;

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6 shadow-(--shadow-card) transition-all duration-300 hover:shadow-xl">

      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-(--text-secondary)">
            Portfolio Value
          </p>

          <h2 className="mt-2 text-4xl font-bold tracking-tight text-(--text-primary)">
            {loaded ? fmtINR(netWorth) : "—"}
          </h2>

          <p className={`mt-3 flex items-center gap-2 font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
            {positive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            {loaded
              ? `${fmtSigned(pl)} (${plPercent >= 0 ? "+" : ""}${plPercent?.toFixed?.(2) ?? 0}%)`
              : "—"}
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <Wallet className="text-blue-500" size={28} />
        </div>
      </div>

      {/* Stats */}

      <div className="mt-8 space-y-3">

        {/* Unrealized P/L */}

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">

          <div className="flex items-center gap-3">

            <div className={`rounded-xl p-2.5 ${positive ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <TrendingUp
                size={18}
                className={positive ? "text-green-500" : "text-red-500"}
              />
            </div>

            <div>
              <p className="text-xs text-(--text-secondary)">
                Unrealized P/L
              </p>

              <p className={`font-semibold text-(--text-primary)`}>
                {loaded ? fmtSigned(pl) : "—"}
              </p>
            </div>

          </div>

          <span className={`text-sm font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
            {loaded ? `${plPercent >= 0 ? "+" : ""}${plPercent?.toFixed?.(2) ?? 0}%` : "—"}
          </span>

        </div>

        {/* Cash */}

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-500/10 p-2.5">
              <IndianRupee
                size={18}
                className="text-blue-500"
              />
            </div>

            <div>
              <p className="text-xs text-(--text-secondary)">
                Available Cash
              </p>

              <p className="font-semibold text-(--text-primary)">
                {loaded ? fmtINR(balance) : "—"}
              </p>
            </div>

          </div>

        </div>

        {/* Holdings */}

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-violet-500/10 p-2.5">
              <BriefcaseBusiness
                size={18}
                className="text-violet-500"
              />
            </div>

            <div>
              <p className="text-xs text-(--text-secondary)">
                Holdings
              </p>

              <p className="font-semibold text-(--text-primary)">
                {loaded ? `${holdingsCount} Stock${holdingsCount === 1 ? "" : "s"}` : "—"}
              </p>
            </div>

          </div>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
            Active
          </span>

        </div>

      </div>

      {error && (
        <p className="mt-4 text-center text-xs text-red-400">
          Couldn't load your portfolio.
        </p>
      )}

      {/* Footer */}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate("/portfolio")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-lg"
        >
          View Portfolio
          <ArrowUpRight size={18} />
        </button>

        <button
          onClick={loadPortfolio}
          title="Refresh portfolio"
          className="flex items-center justify-center rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 text-(--text-secondary) transition hover:bg-(--surface-1)"
        >
          <RefreshCw size={18} />
        </button>
      </div>

    </div>
  );
}
