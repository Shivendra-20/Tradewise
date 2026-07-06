import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export default function PortfolioCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-full">

      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-400">
            Portfolio Value
          </p>

          <h2 className="text-4xl font-bold mt-2">
            ₹1,00,000
          </h2>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <Wallet
            className="text-green-400"
            size={26}
          />
        </div>

      </div>

      <div className="mt-8 space-y-5">

        <div className="flex justify-between">

          <span className="text-gray-400">
            Today's P/L
          </span>

          <span className="text-green-400 font-semibold">
            +₹2,540
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Total Return
          </span>

          <span className="text-green-400 font-semibold flex items-center gap-1">

            <TrendingUp size={17} />

            +4.52%

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Available Balance
          </span>

          <span>
            ₹76,350
          </span>

        </div>

      </div>

      <button
        className="
        mt-10
        w-full
        bg-green-500
        hover:bg-green-400
        transition
        py-3
        rounded-xl
        font-semibold
        text-black
        flex
        items-center
        justify-center
        gap-2
      "
      >
        View Portfolio

        <ArrowUpRight size={18} />

      </button>

    </div>
  );
}