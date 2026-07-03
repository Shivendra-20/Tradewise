import { TrendingUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 bg-black">

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">

        <div className="flex items-center gap-2 text-white font-bold text-2xl">
          <TrendingUp className="text-green-400" />
          TradeWise
        </div>

        <p className="text-gray-500 mt-5 md:mt-0">
          © 2026 TradeWise. All rights reserved.
        </p>

      </div>

    </footer>
  );
}