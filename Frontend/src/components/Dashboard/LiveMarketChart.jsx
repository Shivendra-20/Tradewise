import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function LiveMarketChart() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 350,

      layout: {
        background: {
          color: "#18181B",
        },
        textColor: "#A1A1AA",
      },

      grid: {
        vertLines: {
          color: "#27272A",
        },
        horzLines: {
          color: "#27272A",
        },
      },

      rightPriceScale: {
        borderColor: "#27272A",
      },

      timeScale: {
        borderColor: "#27272A",
      },
    });

    // v5 API
   const series = chart.addAreaSeries({
  lineColor: "#22C55E",
  topColor: "rgba(34,197,94,0.35)",
  bottomColor: "rgba(34,197,94,0.03)",
  lineWidth: 3,
});

    series.setData([
      { time: "2026-06-30", value: 24650 },
      { time: "2026-07-01", value: 24780 },
      { time: "2026-07-02", value: 24720 },
      { time: "2026-07-03", value: 24950 },
      { time: "2026-07-04", value: 25080 },
      { time: "2026-07-05", value: 25220 },
      { time: "2026-07-06", value: 25461 },
    ]);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-400">NIFTY 50</p>

          <h2 className="text-4xl font-bold mt-2">
            25,461.30
          </h2>

          <p className="text-green-400 mt-2">
            +185.25 (+0.73%)
          </p>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-green-500 text-black font-medium">
            1D
          </button>

          <button className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700">
            1W
          </button>

          <button className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700">
            1M
          </button>

          <button className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700">
            1Y
          </button>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[350px]"
      />
    </div>
  );
}   