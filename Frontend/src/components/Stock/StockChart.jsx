import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { CandlestickChart, LineChart } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getStockHistory } from "../../api/stock.js";
import { useLiveQuote, subscribeSymbols } from "../../lib/realtime.js";

const timeframes = ["1D", "1W", "1M", "3M", "1Y"];

function useChart(containerRef, { areaData, candleData, theme, chartType, height, positive, live, timeframe }) {
  const seriesRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isDark = theme === "dark";
    const textColor = isDark ? "#A1A1AA" : "#475569";
    const bgColor = isDark ? "#18181B" : "#FFFFFF";
    const borderColor = isDark ? "rgba(148,163,184,.12)" : "rgba(148,163,184,.18)";

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

    let series;
      if (chartType === "candles") {
        series = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        series.setData(candleData);
      } else {
      series = chart.addAreaSeries({
        lineColor: positive ? "#22c55e" : "#ef4444",
        topColor: positive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
        bottomColor: positive ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)",
        lineWidth: 3,
      });
      series.setData(areaData);
    }

    seriesRef.current = series;
    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      seriesRef.current = null;
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaData, candleData, theme, chartType, height, positive]);

  // Live tick updates: update the current bar instead of rebuilding the chart.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || live?.price == null) return;

    try {
      const isIntraday = timeframe === "1D";
      const last = chartType === "candles"
        ? candleData[candleData.length - 1]
        : areaData[areaData.length - 1];

      const time = isIntraday
        ? Math.floor(((live.timestamp || Date.now()) / 1000) / 60) * 60
        : last?.time ?? Math.floor(Date.now() / 1000);

      if (chartType === "candles") {
        series.update({
          time,
          open: last?.open ?? live.price,
          high: Math.max(last?.high ?? live.price, live.price),
          low: Math.min(last?.low ?? live.price, live.price),
          close: live.price,
        });
      } else {
        series.update({ time, value: live.price });
      }
    } catch {
      // ignore transient update errors (series may have been recreated)
    }
  }, [live, chartType, timeframe, areaData, candleData]);
}

function ChartCanvas(props) {
  const ref = useRef(null);
  useChart(ref, props);
  return <div ref={ref} className="w-full" style={{ height: props.height }} />;
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

export default function StockChart({
  stock,
  symbol,
  height = 420,
  compact = false,
  showChartTypeToggle = true,
  onTimeframeChange,
}) {
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("area");
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyWarning, setHistoryWarning] = useState("");

  const activeSymbol = (symbol || stock?.symbol || "").toUpperCase();
  const live = useLiveQuote(activeSymbol);

  useEffect(() => {
    if (activeSymbol) subscribeSymbols([activeSymbol]);
  }, [activeSymbol]);

  const requestIdRef = useRef(0);

  const loadHistory = async () => {
    const requestId = ++requestIdRef.current;
    setHistoryLoading(true);
    setHistoryWarning("");

    try {
      const res = await getStockHistory(activeSymbol, selectedTimeframe);
      const candles = res?.data?.data?.candles;

      if (requestId !== requestIdRef.current) return;
      if (Array.isArray(candles) && candles.length > 0) {
        setHistory({
          candles,
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
      console.error(`Failed to load history for ${activeSymbol}:`, error);
      if (requestId === requestIdRef.current) {
        setHistoryWarning("Chart data unavailable right now");
      }
    } finally {
      if (requestId === requestIdRef.current) setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSymbol) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol, selectedTimeframe]);

  const areaData = useMemo(
    () => (history ? history.candles.map((c) => ({ time: c.time, value: c.close })) : []),
    [history]
  );
  const candleData = useMemo(() => (history ? history.ohlc : []), [history]);

  const displayPrice = live?.price ?? stock?.price;
  const displayChange = live?.change ?? stock?.change;
  const displayChangePercent = live?.changePercent ?? stock?.changePercent;
  const positive = (displayChange ?? 0) >= 0;
  const hasLive = live?.price != null;

  function handleTimeframe(tf) {
    setSelectedTimeframe(tf);
    onTimeframeChange?.(tf);
  }

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) shadow-lg">
      {!compact && (
        <div className="flex flex-col gap-5 border-b border-(--border-color) p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-(--text-secondary)">
                {stock?.companyName || stock?.name || "Stock"}
              </p>
              {hasLive && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  Live
                </span>
              )}
            </div>
            <h2 className="mt-2 text-4xl font-bold">
              ₹{displayPrice != null ? Number(displayPrice).toLocaleString("en-IN") : "—"}
            </h2>
            <p className={`mt-2 font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
              {displayChange != null
                ? `${positive ? "+" : ""}${Number(displayChange).toFixed(2)} (${Number(
                    displayChangePercent ?? 0
                  ).toFixed(2)}%)`
                : "—"}
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
            {historyLoading && (
              <p className="text-xs text-(--text-secondary)">Loading chart data…</p>
            )}
            {!historyLoading && historyWarning && (
              <p className="flex items-center gap-2 text-xs text-amber-400">
                {historyWarning}
                <button
                  onClick={loadHistory}
                  className="rounded-lg border border-(--border-color) px-2 py-0.5 font-medium text-(--text-secondary) transition hover:bg-(--surface-2)"
                >
                  Retry
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      <div className={compact ? "p-2" : "px-2 pb-2"}>
        {!historyLoading && !history && (
          <div
            className="flex w-full items-center justify-center rounded-2xl border border-dashed border-(--border-color)"
            style={{ height }}
          >
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
        {history && (
          <ChartCanvas
            areaData={areaData}
            candleData={candleData}
            theme={theme}
            chartType={chartType}
            height={height}
            positive={positive}
            live={live}
            timeframe={selectedTimeframe}
          />
        )}
      </div>
    </div>
  );
}
