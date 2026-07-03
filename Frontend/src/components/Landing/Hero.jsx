import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {

const tickerData = [
  { name: "NIFTY 50", price: "25,512.35", change: "+182.40", up: true },
  { name: "SENSEX", price: "83,745.61", change: "+521.22", up: true },
  { name: "BANKNIFTY", price: "57,890.40", change: "-102.15", up: false },
  { name: "RELIANCE", price: "1,582.40", change: "+18.60", up: true },
  { name: "TCS", price: "3,985.20", change: "-22.15", up: false },
  { name: "INFY", price: "1,702.45", change: "+11.50", up: true },
];

  return (
    
    <section id="hero" className=" min-h-screen bg-black text-white flex items-center relative overflow-hidden pt-24">
        
      <div className="absolute w-[700px] h-[700px] rounded-full bg-green-500/20 blur-[150px] right-0 top-20"></div>
    
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Side */}
        <div>
        

         <div className="overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md py-3 mb-10">
    <div className="ticker-track flex w-max">
    {[...tickerData, ...tickerData].map((item, index) => (
      <div
        key={index}
        className="flex items-center gap-3 px-8 whitespace-nowrap"
      >
        <span className="font-semibold text-white">
          {item.name}
        </span>

        <span className="text-gray-300">
          {item.price}
        </span>

        <span
          className={`font-semibold ${
            item.up ? "text-green-400" : "text-red-400"
          }`}
        >
          {item.change}
        </span>
      </div>
    ))}
  </div>
</div>
          <h1 className="text-6xl font-black  leading-tight">

            Master Stock Trading

            <span className="text-green-400">
              {" "}Without Losing Money
            </span>

          </h1>

          <p className="text-gray-400 text-xl mt-8 leading-9">

            TradeWise lets you simulate real stock market investments
            using virtual money. Learn, practice and build confidence
            before investing in the real market.

          </p>

          <div className="flex gap-5 mt-10">

            <Link
              to="/register"
              className="bg-green-500 hover:bg-green-400 px-7 py-4 rounded-xl font-semibold flex items-center gap-2 transition"
            >
              Start Trading
              <ArrowRight size={20} />
            </Link>

            <a
              href="#features"
              className="border border-white/20 px-7 py-4 rounded-xl hover:bg-white/10 transition"
            >
              Learn More
            </a>

          </div>

          <div className="flex gap-12 mt-16">

            <div>
              <h2 className="text-3xl font-bold">10K+</h2>
              <p className="text-gray-500">Virtual Trades</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold">500+</h2>
              <p className="text-gray-500">Stocks</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold">100%</h2>
              <p className="text-gray-500">Risk Free</p>
            </div>

          </div>

        </div>

        {/* Right Side */}
        <div className="hidden lg:flex justify-center">

          <img
            src="/images.jpg"
            alt="dashboard"
            className="rounded-3xl shadow-2xl border border-white/10"
          />

        </div>

      </div>

    </section>
  );
}