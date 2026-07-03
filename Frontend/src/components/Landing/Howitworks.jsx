const steps = [
  "Create your account",
  "Get virtual balance",
  "Search stocks",
  "Buy & Sell",
  "Track Portfolio",
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-neutral-950" id="how">

      <h2 className="text-center text-5xl font-bold text-white">
        How It Works
      </h2>

      <div className="max-w-6xl mx-auto mt-20 grid md:grid-cols-5 gap-8 px-6">

        {steps.map((step, i) => (
          <div key={step} className="text-center">

            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              {i + 1}
            </div>

            <p className="text-white mt-5">{step}</p>

          </div>
        ))}

      </div>

    </section>
  );
}