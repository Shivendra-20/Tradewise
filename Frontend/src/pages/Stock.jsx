import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChart } from "lightweight-charts";
import {
  Activity,
  ArrowLeft,
  BellRing,
  Blocks,
  BookOpen,
  CandlestickChart,
  ChevronRight,
  CircleDollarSign,
  Eye,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import { formatCurrency, formatPercent } from "../lib/formatters.js";
import { getStockProfile } from "../lib/stockMockData.js";

const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "Max"];
const chartTypes = ["Candlestick", "Line"];
const indicatorOptions = ["EMA", "SMA", "RSI", "MACD", "Bollinger"];

function StatBlock({ label, value, accent = "text-zinc-300" }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-(--surface-2) p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

export default function Stock() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);
  const [activeRange, setActiveRange] = useState("1D");
  const [chartType, setChartType] = useState("Candlestick");
  const [activeIndicator, setActiveIndicator] = useState("EMA");
  const [isLoading, setIsLoading] = useState(true);
  const [financialView, setFinancialView] = useState("yearly");
  const [hoverPrice, setHoverPrice] = useState(null);

  const stockProfile = useMemo(() => getStockProfile(symbol), [symbol]);
  const selectedSeries = useMemo(() => stockProfile.chartData[activeRange] ?? stockProfile.chartData["1D"], [activeRange, stockProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.14)" },
        horzLines: { color: "rgba(148, 163, 184, 0.14)" },
      },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.18)" },
      timeScale: { borderColor: "rgba(148, 163, 184, 0.18)" },
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const priceFormatter = (price) => `₹${price.toFixed(2)}`;
    chart.applyOptions({
      localization: { priceFormatter },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    if (chartType === "Candlestick") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
      });
      candleSeries.setData(selectedSeries.candles);

      const volumeSeries = chart.addHistogramSeries({
        color: "rgba(34,197,94,0.35)",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.setData(
        selectedSeries.volume.map((item) => ({
          ...item,
          color: item.value > 1800000 ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.35)",
        }))
      );
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    } else {
      const lineSeries = chart.addAreaSeries({
        lineColor: "#22c55e",
        topColor: "rgba(34,197,94,0.28)",
        bottomColor: "rgba(34,197,94,0.03)",
        lineWidth: 2,
      });
      lineSeries.setData(selectedSeries.line);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth ?? 0 });
    };

    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData && param.seriesData instanceof Map) {
        const seriesValue = param.seriesData.get(chart.serieses().at(0));
        setHoverPrice(seriesValue?.value ?? seriesValue?.close ?? null);
      } else {
        setHoverPrice(null);
      }
    });

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      setHoverPrice(null);
    };
  }, [selectedSeries, chartType]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl border border-zinc-800 bg-linear-to-br from-zinc-900 via-zinc-900 to-green-950/30 p-6 shadow-[0_0_80px_rgba(34,197,94,0.08)] sm:p-8"
        >
          <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold text-green-400">
                {stockProfile.logoText}
              </div>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  <Sparkles size={14} />
                  {symbol}
                </div>
                <h1 className="text-3xl font-semibold sm:text-4xl">{stockProfile.companyName}</h1>
                <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">{stockProfile.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-400">
                  <span className="rounded-full bg-white/5 px-3 py-1">{stockProfile.exchange}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{stockProfile.sector}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1">{stockProfile.industry}</span>
                  <a href={stockProfile.website} target="_blank" rel="noreferrer" className="rounded-full bg-white/5 px-3 py-1 transition hover:text-green-400">
                    {stockProfile.website}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-400">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-green-300">Live price</p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(stockProfile.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-300">{formatPercent(stockProfile.changePercent)}</p>
                  <p className="mt-1 text-sm text-zinc-400">{stockProfile.marketStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 p-5">
              <div>
                <p className="text-sm text-zinc-400">Professional chart</p>
                <p className="mt-1 text-2xl font-semibold">{hoverPrice ? formatCurrency(hoverPrice) : formatCurrency(stockProfile.price)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {timeframes.map((range) => (
                  <button
                    key={range}
                    onClick={() => setActiveRange(range)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${activeRange === range ? "bg-green-500 text-black" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {chartTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${chartType === type ? "bg-green-500 text-black" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"}`}
                  >
                    {type}
                  </button>
                ))}
                {indicatorOptions.map((indicator) => (
                  <button
                    key={indicator}
                    onClick={() => setActiveIndicator(indicator)}
                    className={`rounded-xl px-3 py-2 text-sm transition ${activeIndicator === indicator ? "bg-white/10 text-white" : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700"}`}
                  >
                    {indicator}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Eye size={16} />
                <span>Crosshair • Zoom • Volume • Live</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex h-105 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-green-500/20 border-t-green-500" />
              </div>
            ) : (
              <div ref={chartContainerRef} className="h-105 w-full" />
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <Activity size={18} />
              <h2 className="text-lg font-semibold">Live market data</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatBlock label="Price change" value={formatCurrency(stockProfile.change)} accent="text-green-400" />
              <StatBlock label="% change" value={formatPercent(stockProfile.changePercent)} accent="text-green-400" />
              <StatBlock label="Open" value={formatCurrency(stockProfile.open)} />
              <StatBlock label="High" value={formatCurrency(stockProfile.high)} />
              <StatBlock label="Low" value={formatCurrency(stockProfile.low)} />
              <StatBlock label="Prev Close" value={formatCurrency(stockProfile.previousClose)} />
              <StatBlock label="52W High" value={formatCurrency(stockProfile.weekHigh)} />
              <StatBlock label="52W Low" value={formatCurrency(stockProfile.weekLow)} />
              <StatBlock label="Volume" value={stockProfile.volume.toLocaleString("en-IN")} />
              <StatBlock label="Avg Volume" value={stockProfile.averageVolume.toLocaleString("en-IN")} />
              <StatBlock label="Market status" value={stockProfile.marketStatus} accent="text-green-400" />
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-black transition hover:bg-green-400">Buy</button>
              <button className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 font-semibold text-white transition hover:border-red-400 hover:text-red-400">Sell</button>
            </div>
            <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
              <div className="flex items-center justify-between">
                <span>Signal</span>
                <span>Momentum improving</span>
              </div>
              <p className="mt-2 text-zinc-400">Support remains healthy and the trend is still constructive for the next session.</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <BookOpen size={18} />
              <h3 className="text-lg font-semibold">Company overview</h3>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatBlock label="Company" value={stockProfile.companyName} />
              <StatBlock label="Symbol" value={stockProfile.symbol} />
              <StatBlock label="Exchange" value={stockProfile.exchange} />
              <StatBlock label="Sector" value={stockProfile.sector} />
              <StatBlock label="Industry" value={stockProfile.industry} />
              <StatBlock label="Website" value={stockProfile.website} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <CircleDollarSign size={18} />
              <h3 className="text-lg font-semibold">Key financial metrics</h3>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(stockProfile.metrics).map(([label, value]) => (
                <StatBlock key={label} label={label.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={value} />
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <LineChart size={18} />
              <h3 className="text-lg font-semibold">Growth & performance</h3>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Revenue growth", stockProfile.growth.revenue],
                ["Profit growth", stockProfile.growth.profit],
                ["EPS growth", stockProfile.growth.eps],
              ].map(([title, data]) => (
                <div key={title} className="rounded-2xl border border-zinc-800/80 bg-(--surface-2) p-4">
                  <p className="text-sm text-zinc-400">{title}</p>
                  <div className="mt-3 space-y-2">
                    {data.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
                        <span>{item.label}</span>
                        <span className="font-semibold text-green-400">{item.value}T</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <ShieldCheck size={18} />
              <h3 className="text-lg font-semibold">Analyst & technical</h3>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm text-green-300">Consensus</p>
                <p className="mt-2 text-xl font-semibold">{stockProfile.analyst.rating}</p>
                <p className="mt-1 text-sm text-zinc-400">Target price: {stockProfile.analyst.targetPrice}</p>
              </div>
              <div className="rounded-2xl bg-(--surface-2) p-4 text-sm text-zinc-400">
                {stockProfile.analyst.technicalSummary}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <BellRing size={18} />
              <h3 className="text-lg font-semibold">News & events</h3>
            </div>
            <div className="mt-5 space-y-3">
              {stockProfile.news.map((item) => (
                <div key={item.title} className="rounded-2xl border border-zinc-800/80 bg-(--surface-2) p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>{item.tag}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <CandlestickChart size={18} />
              <h3 className="text-lg font-semibold">Financials</h3>
            </div>
            <div className="mt-4 flex gap-2">
              {['yearly', 'quarterly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setFinancialView(view)}
                  className={`rounded-xl px-3 py-2 text-sm transition ${financialView === view ? "bg-green-500 text-black" : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"}`}
                >
                  {view === "yearly" ? "Yearly" : "Quarterly"}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Income statement", stockProfile.financials.incomeStatement[financialView]],
                ["Balance sheet", stockProfile.financials.balanceSheet[financialView]],
                ["Cash flow", stockProfile.financials.cashFlow[financialView]],
              ].map(([title, rows]) => (
                <div key={title} className="rounded-2xl border border-zinc-800/80 bg-(--surface-2) p-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <div className="mt-3 space-y-2">
                    {rows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{item.label}</span>
                        <span className="font-medium text-white">{item.revenue ?? item.assets ?? item.operating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-green-400">
              <Blocks size={18} />
              <h3 className="text-lg font-semibold">Trading panel</h3>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <div className="flex items-center justify-between text-sm text-green-300">
                  <span>Order summary</span>
                  <span>Validated</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(stockProfile.price * 10)}</p>
                <p className="mt-2 text-sm text-zinc-400">Estimated cost • 10 shares</p>
              </div>
              <div className="rounded-2xl bg-(--surface-2) p-4 text-sm text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Buy / Sell</span>
                  <span className="font-medium text-white">Market order</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span>Risk profile</span>
                  <span className="font-medium text-white">Balanced</span>
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-black transition hover:bg-green-400">
                Place order <ChevronRight size={16} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}