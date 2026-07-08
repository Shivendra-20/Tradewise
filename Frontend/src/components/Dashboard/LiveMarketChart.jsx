import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { ChevronDown, Maximize2, X, CandlestickChart, LineChart } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

// ---------------------------------------------------------------------------
// Demo data. Replace `data` (closing prices) with real candles from your
// /api/stocks/:symbol/history endpoint. `ohlc` is derived automatically below
// so the candlestick view works even before you wire up real OHLC data.
// ---------------------------------------------------------------------------

function seededWobble(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Turns a simple array of closing prices into open/high/low/close candles.
// Swap this out once your backend returns real OHLC — it's only here so the
// candlestick chart has something believable to render from the old `data`.
function toOHLC(closes) {
  return closes.map((close, i) => {
    const open = i === 0 ? close * 0.998 : closes[i - 1];
    const wobble = seededWobble(i * 13.37 + close) * 0.006;
    const high = Math.max(open, close) * (1 + wobble);
    const low = Math.min(open, close) * (1 - wobble);
    return { open, high, low, close };
  });
}

function dateFor(i) {
  const base = new Date("2026-07-01T00:00:00Z");
  base.setUTCDate(base.getUTCDate() + i);
  return base.toISOString().split("T")[0];
}

const RAW_INDICES = [
  {
    name: "NIFTY 50",
    symbol: "NIFTY50",
    price: "25,461.30",
    change: "+185.25 (+0.73%)",
    positive: true,
    data: [24650, 24780, 24720, 24950, 25080, 25220, 25461],
  },
  {
    name: "SENSEX",
    symbol: "SENSEX",
    price: "83,425.15",
    change: "-92.45 (-0.11%)",
    positive: false,
    data: [83450, 83600, 83520, 83780, 83490, 83425],
  },
  {
    name: "BANKNIFTY",
    symbol: "BANKNIFTY",
    price: "57,285.20",
    change: "+425.40 (+0.74%)",
    positive: true,
    data: [56800, 57020, 57150, 57400, 57250, 57285],
  },
  {
    name: "FINNIFTY",
    symbol: "FINNIFTY",
    price: "27,154.10",
    change: "+112.60 (+0.42%)",
    positive: true,
    data: [26800, 26950, 27020, 27100, 27080, 27154],
  },
];

const indices = RAW_INDICES.map((item) => ({ ...item, ohlc: toOHLC(item.data) }));

const timeframes = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

// ---------------------------------------------------------------------------
// Chart rendering — one function used by both the inline card and the
// fullscreen modal, so there's a single source of truth for chart options.
// ---------------------------------------------------------------------------

function useCandleOrArea(containerRef, { item, theme, chartType, height }) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !item) return;

    const isDark = theme === "dark";

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: isDark ? "#18181B" : "#ffffff" },
        textColor: isDark ? "#A1A1AA" : "#475569",
      },
      grid: {
        vertLines: { color: isDark ? "#27272A" : "#e5e7eb" },
        horzLines: { color: isDark ? "#27272A" : "#e5e7eb" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: isDark ? "#27272A" : "#e5e7eb" },
      timeScale: {
        borderColor: isDark ? "#27272A" : "#e5e7eb",
        timeVisible: true,
      },
    });

    if (chartType === "candles") {
      const series = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      series.setData(
        item.ohlc.map((candle, i) => ({ time: dateFor(i), ...candle }))
      );
    } else {
      const series = chart.addAreaSeries({
        lineColor: item.positive ? "#22c55e" : "#ef4444",
        topColor: item.positive ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
        bottomColor: item.positive ? "rgba(34,197,94,0.02)" : "rgba(239,68,68,0.02)",
        lineWidth: 3,
      });
      series.setData(item.data.map((value, i) => ({ time: dateFor(i), value })));
    }

    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, theme, chartType, height]);
}

function ChartCanvas({ item, theme, chartType, height }) {
  const ref = useRef(null);
  useCandleOrArea(ref, { item, theme, chartType, height });
  return <div ref={ref} className="w-full" style={{ height }} />;
}

// ---------------------------------------------------------------------------
// Small shared controls
// ---------------------------------------------------------------------------

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

function TimeframeRow({ selectedTimeframe, setSelectedTimeframe }) {
  return (
    <div className="flex flex-wrap gap-2">
      {timeframes.map((time) => (
        <button
          key={time}
          onClick={() => setSelectedTimeframe(time)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            selectedTimeframe === time
              ? "bg-green-500 text-black"
              : "bg-(--surface-2) hover:bg-(--surface-2)"
          }`}
        >
          {time}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LiveMarketChart({ symbol } = {}) {
  const { theme } = useTheme();

  const initial =
    indices.find((i) => i.symbol === symbol) ?? indices[0];

  const [selectedIndex, setSelectedIndex] = useState(initial);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [dropdown, setDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll + support Esc to close while fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const onKey = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const showDropdown = !symbol; // hide the index switcher when embedded on a single stock page

  return (
    <>
      <div className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
          <div className="relative">
            {showDropdown ? (
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2 text-lg font-semibold hover:text-green-400"
              >
                {selectedIndex.name}
                <ChevronDown size={18} />
              </button>
            ) : (
              <span className="text-lg font-semibold">{selectedIndex.name}</span>
            )}

            {dropdown && showDropdown && (
              <div className="absolute top-10 left-0 z-50 w-48 rounded-2xl border border-(--border-color) bg-(--bg-secondary) p-2 shadow-xl">
                {indices.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setSelectedIndex(item);
                      setDropdown(false);
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-(--surface-2)"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              ₹{selectedIndex.price}
            </h1>

            <p
              className={`mt-2 text-lg font-medium ${
                selectedIndex.positive ? "text-green-400" : "text-red-400"
              }`}
            >
              {selectedIndex.change}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-2">
              <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
              <button
                onClick={() => setIsFullscreen(true)}
                title="Open full chart"
                className="flex items-center gap-1.5 rounded-xl border border-(--border-color) bg-(--surface-2) px-3 py-2 text-sm font-medium hover:bg-(--surface-1)"
              >
                <Maximize2 size={15} />
                Full chart
              </button>
            </div>
            <TimeframeRow
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
            />
          </div>
        </div>

        {/* Chart */}
        <div className="mt-8">
          <ChartCanvas item={selectedIndex} theme={theme} chartType={chartType} height={430} />
        </div>
      </div>

      {/* Fullscreen mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-(--bg-secondary)/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-(--border-color) px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedIndex.name}</h2>
              <p
                className={`text-sm font-medium ${
                  selectedIndex.positive ? "text-green-400" : "text-red-400"
                }`}
              >
                ₹{selectedIndex.price} · {selectedIndex.change}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
              <button
                onClick={() => setIsFullscreen(false)}
                className="rounded-xl border border-(--border-color) bg-(--surface-2) p-2 hover:bg-(--surface-1)"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 px-6 py-6">
            <ChartCanvas
              item={selectedIndex}
              theme={theme}
              chartType={chartType}
              height={window.innerHeight - 220}
            />
          </div>

          <div className="border-t border-(--border-color) px-6 py-4">
            <TimeframeRow
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
            />
          </div>
        </div>
      )}
    </>
  );
}

export { indices as demoInstruments };