import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { ChevronDown, Maximize2, X, CandlestickChart, LineChart } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getStockHistory } from "../../api/stock.js";
import { useLiveQuote, subscribeSymbols } from "../../lib/realtime.js";

// ---------------------------------------------------------------------------
// Indices supported by the Upstox feed (index instrument keys are resolved
// by the backend). History + live ticks come from Upstox; the demo series is
// only a fallback when the API is unreachable.
// ---------------------------------------------------------------------------

const indices = [
  { name: "NIFTY 50", symbol: "NIFTY50" },
  { name: "SENSEX", symbol: "SENSEX" },
  { name: "BANKNIFTY", symbol: "NIFTYBANK" },
  { name: "FINNIFTY", symbol: "NIFTYFIN" },
];

const timeframes = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

// ---------------------------------------------------------------------------
// Chart rendering — one function used by both the inline card and the
// fullscreen modal, so there's a single source of truth for chart options.
// ---------------------------------------------------------------------------

function useIndexChart(containerRef, { base, livePrice, theme, chartType, height, positive }) {
  const seriesRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !base) return;

    const isDark = theme === "dark";
    const textColor = isDark ? "#A1A1AA" : "#475569";
    const borderColor = isDark ? "rgba(148,163,184,.12)" : "rgba(148,163,184,.18)";

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: isDark ? "#18181B" : "#ffffff" },
        textColor,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,.08)" },
        horzLines: { color: "rgba(148,163,184,.08)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: true },
    });

    let chartSeries;
    if (chartType === "candles") {
      chartSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      chartSeries.setData(base.ohlc);
    } else {
      chartSeries = chart.addAreaSeries({
        lineColor: positive ? "#22c55e" : "#ef4444",
        topColor: positive ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
        bottomColor: positive ? "rgba(34,197,94,0.02)" : "rgba(239,68,68,0.02)",
        lineWidth: 3,
      });
      chartSeries.setData(
        base.closes.map((value, i) => ({ time: base.times[i], value }))
      );
    }

    seriesRef.current = chartSeries;
    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      seriesRef.current = null;
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, theme, chartType, height, positive]);

  // Append live ticks to the current bar without rebuilding the chart.
  useEffect(() => {
    const chartSeries = seriesRef.current;
    if (!chartSeries || !base || livePrice == null) return;

    try {
      const lastIndex = base.times.length - 1;
      const lastTime = base.times[lastIndex];

      if (chartType === "candles") {
        const last = base.ohlc[lastIndex];
        chartSeries.update({
          time: lastTime,
          open: last?.open ?? livePrice,
          high: Math.max(last?.high ?? livePrice, livePrice),
          low: Math.min(last?.low ?? livePrice, livePrice),
          close: livePrice,
        });
      } else {
        chartSeries.update({ time: lastTime, value: livePrice });
      }
    } catch {
      // ignore transient updates while the series is being recreated
    }
  }, [base, livePrice, chartType]);
}

function ChartCanvas(props) {
  const ref = useRef(null);
  useIndexChart(ref, props);
  return <div ref={ref} className="w-full" style={{ height: props.height }} />;
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
              ? "bg-blue-600 text-white"
              : "bg-(--surface-2) hover:bg-(--surface-1)"
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

  const matching = symbol
    ? indices.find((i) => i.symbol === symbol.toUpperCase())
    : undefined;

  const [pickedIndex, setPickedIndex] = useState(null);
  const selectedIndex = matching ?? pickedIndex ?? indices[0];
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [dropdown, setDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyWarning, setHistoryWarning] = useState("");

  const live = useLiveQuote(selectedIndex.symbol);

  useEffect(() => {
    subscribeSymbols(indices.map((i) => i.symbol));
  }, []);

  const requestIdRef = useRef(0);

  const loadHistory = async () => {
    const requestId = ++requestIdRef.current;
    setHistoryLoading(true);
    setHistoryWarning("");

    try {
      const res = await getStockHistory(selectedIndex.symbol, selectedTimeframe);
      const candles = res?.data?.data?.candles;

      if (requestId !== requestIdRef.current) return;
      if (Array.isArray(candles) && candles.length > 0) {
        setHistory({
          symbol: selectedIndex.symbol,
          timeframe: selectedTimeframe,
          times: candles.map((c) => c.time),
          closes: candles.map((c) => c.close),
          ohlc: candles.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        });
        if (res?.data?.cached) {
          setHistoryWarning("Live history unavailable — showing last cached data");
        }
      }
    } catch (error) {
      console.error(`Failed to load ${selectedIndex.symbol} history:`, error);
      if (requestId === requestIdRef.current) {
        setHistoryWarning("Chart data unavailable right now");
      }
    } finally {
      if (requestId === requestIdRef.current) setHistoryLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex.symbol, selectedTimeframe]);

  const isCurrentHistory =
    history?.symbol === selectedIndex.symbol &&
    history?.timeframe === selectedTimeframe;

  const base = useMemo(() => {
    if (isCurrentHistory) {
      return { times: history.times, closes: history.closes, ohlc: history.ohlc };
    }
    return null;
  }, [history, isCurrentHistory]);

  const livePrice = live?.price;

  const displayPrice =
    livePrice ??
    (isCurrentHistory ? base.closes[base.closes.length - 1] : null);

  const displayChange =
    live?.change ??
    (isCurrentHistory && history.closes.length > 1
      ? history.closes[history.closes.length - 1] - history.closes[0]
      : undefined);
  const displayChangePercent =
    live?.changePercent ??
    (displayChange != null && base?.closes?.[0]
      ? (displayChange / base.closes[0]) * 100
      : undefined);

  const positive = (displayChange ?? 0) >= 0;
  const hasLive = live?.price != null;

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

  const showDropdown = !symbol; // hide the index switcher when pinned to one index

  return (
    <>
      <div className="rounded-3xl border border-(--border-color) bg-(--surface-1) p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
          <div className="relative">
            <div className="flex items-center gap-2">
              {showDropdown ? (
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-2 text-lg font-semibold hover:text-blue-400"
                >
                  {selectedIndex.name}
                  <ChevronDown size={18} />
                </button>
              ) : (
                <span className="text-lg font-semibold">{selectedIndex.name}</span>
              )}
              {hasLive && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  Live
                </span>
              )}
            </div>

            {dropdown && showDropdown && (
              <div className="absolute top-10 left-0 z-50 w-48 rounded-2xl border border-(--border-color) bg-(--bg-secondary) p-2 shadow-xl">
                {indices.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      setPickedIndex(item);
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
              ₹{displayPrice != null ? Number(displayPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
            </h1>

            <p
              className={`mt-2 text-lg font-medium ${
                positive ? "text-green-400" : "text-red-400"
              }`}
            >
              {displayChange != null
                ? `${positive ? "+" : ""}${Number(displayChange).toFixed(2)} (${
                    displayChangePercent != null
                      ? `${positive ? "+" : ""}${Number(displayChangePercent).toFixed(2)}%`
                      : "—"
                  })`
                : "—"}
            </p>

            {historyLoading && (
              <p className="mt-2 text-xs text-(--text-secondary)">Loading chart data…</p>
            )}
            {!historyLoading && historyWarning && (
              <p className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                {historyWarning}
                <button
                  onClick={loadHistory}
                  className="rounded-lg border border-(--border-color) px-2 py-0.5 font-medium text-(--text-secondary) transition hover:bg-(--surface-1)"
                >
                  Retry
                </button>
              </p>
            )}
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
          {!historyLoading && !base && (
            <div className="flex h-[430px] w-full items-center justify-center rounded-2xl border border-dashed border-(--border-color)">
              <div className="text-center">
                <p className="text-sm font-medium text-(--text-secondary)">
                  Chart data unavailable
                </p>
                <button
                  onClick={loadHistory}
                  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {base && (
            <ChartCanvas
              base={base}
              livePrice={livePrice}
              theme={theme}
              chartType={chartType}
              height={430}
              positive={positive}
            />
          )}
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
                  positive ? "text-green-400" : "text-red-400"
                }`}
              >
                ₹{displayPrice != null ? Number(displayPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"} ·{" "}
                {displayChange != null
                  ? `${positive ? "+" : ""}${Number(displayChange).toFixed(2)}%`
                  : "—"}
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
            {base ? (
              <ChartCanvas
                base={base}
                livePrice={livePrice}
                theme={theme}
                chartType={chartType}
                height={Math.max(window.innerHeight - 220, 300)}
                positive={positive}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-(--text-secondary)">
                    Chart data unavailable
                  </p>
                  <button
                    onClick={loadHistory}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
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
