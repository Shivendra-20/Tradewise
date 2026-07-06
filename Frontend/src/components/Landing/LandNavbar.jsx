import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-2xl "
           onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <TrendingUp className="text-green-400" size={30} />
          TradeWise
        </Link>

        {/* <div className="hidden md:flex items-center gap-10 text-gray-300"> */}


        

        {/* </div> */}

        <div className="flex items-center gap-4 text-gray-300">

          <a href="#features" className="hover:text-white transition">
            Features
          </a>

          <a href="#how" className="hover:text-white transition">
            How it Works
          </a>
          <Link
            to="/login"
            className="text-gray-300 hover:text-white transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-green-500 hover:bg-green-700 px-5 py-2 rounded-xl font-semibold transition text-white"
          >
            Get Started
          </Link>

        </div>

      </div>
    </nav>
  );
}