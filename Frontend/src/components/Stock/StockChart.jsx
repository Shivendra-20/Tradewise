import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { CandlestickChart, LineChart } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

const timeframes = ["1D", "1W", "1M", "3M", "1Y"];

// ---------------------------------------------------------------------------
// Demo fallback so the component still renders something sensible if no
// `data` prop is passed yet (e.g. while wiring up the real API call).
// ---------------------------------------------------------------------------
const DEMO_CLOSES = [2450, 2470, 2462, 2490, 2525, 2510, 2548, 2565];

function dateFor(i, startDate = "2026-07-01") {
  const base = new Date(`${startDate}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + i);
  return base.toISOString().split("T")[0];
}

// Derive fake OHLC from closes only if real OHLC wasn't provided.
function closesToOHLC(closes) {
  return closes.map((close, i) => {
    const open = i === 0 ? close * 0.998 : closes[i - 1];
    const wobble = (Math.sin(i * 13.37 + close) * 10000 % 1) * 0.006;
    const high = Math.max(open, close) * (1 + Math.abs(wobble));
    const low = Math.min(open, close) * (1 - Math.abs(wobble));
    return { open, high, low, close };
  });
}

// ---------------------------------------------------------------------------
// Chart renderer — one function, reused wherever this component is mounted.
// ---------------------------------------------------------------------------
function useChart(containerRef, { closes, ohlc, theme, chartType, height, positive, startDate }) {
  
    useEffect(() => {
    const el = containerRef.current;
    if (!el || !closes?.length) return;

    const isDark = theme === "dark";
    const textColor = isDark ? "#A1A1AA" : "#475569";
    const bgColor = isDark ? "#18181B" : "#FFFFFF";
    const borderColor = isDark? "rgba(148,163,184,.12)": "rgba(148,163,184,.18)";

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: { background: { color: bgColor }, textColor },
      grid: {
        vertLines: { color: "rgba(148,163,184,.08)" },
        horzLines: { color: "rgba(148,163,184,.08)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: true },
    });

    if (chartType === "candles") {
      const candles = ohlc?.length ? ohlc : closesToOHLC(closes);
      const series = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      series.setData(candles.map((c, i) => ({ time: dateFor(i, startDate), ...c })));
    } else {
      const lineColor = positive ? "#22c55e" : "#ef4444";
      const series = chart.addAreaSeries({
        lineColor,
        topColor: positive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
        bottomColor: positive ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)",
        lineWidth: 3,
      });
      series.setData(closes.map((value, i) => ({ time: dateFor(i, startDate), value })));
    }

    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closes, ohlc, theme, chartType, height, positive, startDate]);
}

function ChartCanvas({ closes, ohlc, theme, chartType, height, positive, startDate }) {
  const ref = useRef(null);
  useChart(ref, { closes, ohlc, theme, chartType, height, positive, startDate });
  return <div ref={ref} className="w-full" style={{ height }} />;
}

function ChartTypeToggle({ chartType, setChartType }) {
  return (
    <div className="flex rounded-xl border border-(--border-color) bg-(--surface-2) p-1">
      <button
        onClick={() => setChartType("area")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          chartType === "area"
            ? "bg-(--surface-1) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
      >
        <LineChart size={15} />
        Area
      </button>
      <button
        onClick={() => setChartType("candles")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          chartType === "candles"
            ? "bg-(--surface-1) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
      >
        <CandlestickChart size={15} />
        Candles
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
/**
 * Reusable stock/price chart. Drop this anywhere: stock detail page,
 * dashboard, watchlist card, portfolio row, etc.
 *
 * Props:
 *  - stock: { companyName, price, change, positive, symbol }
 *  - closes: number[]                 (closing prices — required for real data)
 *  - ohlc: {open,high,low,close}[]    (optional — enables accurate candles)
 *  - startDate: "YYYY-MM-DD"          (first date in the series)
 *  - height: number                   (default 420, use smaller for widgets)
 *  - compact: boolean                 (hides header + timeframe row, chart only)
 *  - showChartTypeToggle: boolean     (default true)
 *  - onTimeframeChange: (tf) => void  (fetch new data for the selected range)
 */
export default function StockChart({
  stock,
  closes,
  ohlc,
  startDate = "2026-07-01",
  height = 420,
  compact = false,
  showChartTypeToggle = true,
  onTimeframeChange,
}) {
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");

  const seriesCloses = closes?.length ? closes : DEMO_CLOSES;
  const positive = stock?.positive ?? true;

  function handleTimeframe(tf) {
    setSelectedTimeframe(tf);
    onTimeframeChange?.(tf);
  }

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) shadow-lg">
      {!compact && (
        <div className="flex flex-col gap-5 border-b border-(--border-color) p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-(--text-secondary)">
              {stock?.companyName || "Reliance Industries"}
            </p>
            <h2 className="mt-2 text-4xl font-bold">
              ₹{stock?.price || "2,654.40"}
            </h2>
            <p className={`mt-2 font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
              {stock?.change || "+24.50 (+0.93%)"}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {showChartTypeToggle && (
              <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
            )}
            <div className="flex flex-wrap gap-2">
              {timeframes.map((item) => (
                <button
                  key={item}
                  onClick={() => handleTimeframe(item)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    selectedTimeframe === item
                      ? "bg-blue-600 text-white"
                      : "bg-(--surface-1) text-(--text-secondary) hover:bg-(--surface-2)"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={compact ? "p-2" : "px-2 pb-2"}>
        <ChartCanvas
          closes={seriesCloses}
          ohlc={ohlc}
          theme={theme}
          chartType={chartType}
          height={height}
          positive={positive}
          startDate={startDate}
        />
      </div>
    </div>
  );
}