import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-28 bg-neutral-950">

      <div className="max-w-4xl mx-auto text-center px-6">

        <h2 className="text-5xl text-white font-bold">
          Ready to Become a Better Investor?
        </h2>

        <p className="text-gray-400 mt-6">
          Start trading today with zero financial risk.
        </p>

        <Link
          to="/register"
          className="inline-block mt-10 bg-green-500 px-8 py-4 rounded-xl font-semibold"
        >
          Start Paper Trading
        </Link>

      </div>

    </section>
  );
}