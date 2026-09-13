import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { subscribeSymbols, unsubscribeSymbols, useLiveQuote } from "../../lib/realtime.js";

const fmtINR = (n) =>
  typeof n === "number" && isFinite(n)
    ? `₹${Math.round(n).toLocaleString("en-IN")}`
    : "—";

const fmtSigned = (n) =>
  typeof n === "number" && isFinite(n)
    ? `${n >= 0 ? "+₹" : "-₹"}${Math.abs(Math.round(n)).toLocaleString("en-IN")}`
    : "—";

function LivePL({ holdings, balance }) {
  const symbols = useMemo(
    () => holdings.map((h) => h.stockId?.symbol).filter(Boolean),
    [holdings]
  );

  const livePrices = {};
  for (const sym of symbols) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    livePrices[sym] = useLiveQuote(sym);
  }

  let totalValue = 0;
  let totalInvested = 0;
  for (const h of holdings) {
    const sym = h.stockId?.symbol;
    const live = livePrices[sym];
    const price = live?.price ?? h.stockId?.currentPrice ?? 0;
    totalValue += price * (h.quantity ?? 0);
    totalInvested += (h.avgBuyPrice ?? 0) * (h.quantity ?? 0);
  }

  const pl = totalValue - totalInvested;
  const plPercent = totalInvested > 0 ? (pl / totalInvested) * 100 : 0;
  const netWorth = balance + totalValue;
  const positive = pl >= 0;

  return (
    <>
      <div>
        <p className="text-sm text-(--text-secondary)">Portfolio Value</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight text-(--text-primary)">
          {fmtINR(netWorth)}
        </h2>
        <p className={`mt-3 flex items-center gap-2 font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
          {positive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
          {fmtSigned(pl)} ({plPercent >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${positive ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <TrendingUp size={18} className={positive ? "text-green-500" : "text-red-500"} />
            </div>
            <div>
              <p className="text-xs text-(--text-secondary)">Unrealized P/L</p>
              <p className="font-semibold text-(--text-primary)">{fmtSigned(pl)}</p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
            {plPercent >= 0 ? "+" : ""}{plPercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5">
              <IndianRupee size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-(--text-secondary)">Available Cash</p>
              <p className="font-semibold text-(--text-primary)">{fmtINR(balance)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2.5">
              <BriefcaseBusiness size={18} className="text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-(--text-secondary)">Holdings</p>
              <p className="font-semibold text-(--text-primary)">{holdings.length} Stock{holdings.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">Active</span>
        </div>
      </div>
    </>
  );
}

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

  const holdings = useMemo(() => data?.holdings ?? [], [data?.holdings]);
  const balance = data?.user?.balance ?? 0;
  const loaded = data !== null;

  useEffect(() => {
    if (holdings.length > 0) {
      const symbols = holdings.map((h) => h.stockId?.symbol).filter(Boolean);
      subscribeSymbols(symbols);
      return () => unsubscribeSymbols(symbols);
    }
  }, [holdings]);

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6 shadow-(--shadow-card) transition-all duration-300 hover:shadow-xl">

      {loaded ? (
        <LivePL holdings={holdings} balance={balance} />
      ) : (
        <div>
          <p className="text-sm text-(--text-secondary)">Portfolio Value</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-(--text-primary)">—</h2>
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-(--surface-2)" />
            ))}
          </div>
        </div>
      )}

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
