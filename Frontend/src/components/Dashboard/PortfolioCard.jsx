import {
  ArrowUpRight,
  TrendingUp,
  Wallet,
  IndianRupee,
  BriefcaseBusiness,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PortfolioCard() {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6 shadow-(--shadow-card) transition-all duration-300 hover:shadow-xl">

      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-(--text-secondary)">
            Portfolio Value
          </p>

          <h2 className="mt-2 text-4xl font-bold tracking-tight text-(--text-primary)">
            ₹1,00,000
          </h2>

          <p className="mt-3 flex items-center gap-2 font-medium text-green-500">
            <TrendingUp size={17} />
            +₹4,520 (+4.52%)
          </p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <Wallet className="text-blue-500" size={28} />
        </div>
      </div>

      {/* Stats */}

      <div className="mt-8 space-y-3">

        {/* Today's P/L */}

        <div className="flex items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-2) px-4 py-4 transition hover:scale-[1.02]">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-green-500/10 p-2.5">
              <TrendingUp
                size={18}
                className="text-green-500"
              />
            </div>

            <div>
              <p className="text-xs text-(--text-secondary)">
                Today's P/L
              </p>

              <p className="font-semibold text-(--text-primary)">
                +₹2,540
              </p>
            </div>

          </div>

          <span className="text-sm font-semibold text-green-500">
            +2.54%
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
                ₹76,350
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
                14 Stocks
              </p>
            </div>

          </div>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
            Active
          </span>

        </div>

      </div>

      {/* Footer */}

      <button
        onClick={() => navigate("/portfolio")}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-lg"
      >
        View Portfolio

        <ArrowUpRight size={18} />
      </button>

    </div>
  );
}