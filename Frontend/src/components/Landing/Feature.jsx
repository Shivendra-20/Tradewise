import {
  ShieldCheck,
  Wallet,
  Search,
  BarChart3,
  Star,
  ArrowLeftRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    desc: "JWT-based login and protected routes.",
  },
  {
    icon: Wallet,
    title: "Virtual Trading",
    desc: "Practice investing with virtual money.",
  },
  {
    icon: Search,
    title: "Stock Search",
    desc: "Search thousands of stocks instantly.",
  },
  {
    icon: ArrowLeftRight,
    title: "Buy & Sell",
    desc: "Execute market orders seamlessly.",
  },
  {
    icon: Star,
    title: "Watchlist",
    desc: "Track your favourite companies.",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    desc: "Monitor returns and overall performance.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl text-center font-bold text-white">
          Everything You Need
        </h2>

        <p className="text-center text-gray-400 mt-5">
          Learn investing with professional tools.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">

          {features.map((item) => (
            <div
              key={item.title}
              className="bg-neutral-900 border border-white/10 rounded-3xl p-8 hover:border-green-500 transition"
            >
              <item.icon className="text-green-400 mb-5" size={38} />

              <h3 className="text-white text-2xl font-semibold">
                {item.title}
              </h3>

              <p className="text-gray-400 mt-4">{item.desc}</p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}