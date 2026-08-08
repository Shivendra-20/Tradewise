import { useCallback, useEffect, useRef, useState } from "react";

import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import MarketHeader from "../components/Market/MarketHeader.jsx";
import StockCard from "../components/Market/StockCard.jsx";
import MarketFilters from "../components/Market/MarketFilter.jsx";
import MarketMoversStrip from "../components/Market/MarketMoversStrip.jsx";
import SearchModal from "../components/common/SearchModal.jsx";
import { getStocks, getStockSectors } from "../api/stock.js";
import { getMarketStatus } from "../lib/marketTime.js";

const PAGE_SIZE = 60;

const DEFAULT_FILTERS = {
  search: "",
  exchange: "All",
  sector: "All",
  sort: "Market Cap",
};

export default function Market() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sectors, setSectors] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [movers, setMovers] = useState({ gainers: [], losers: [], active: [] });
  const [stats, setStats] = useState({ listed: 0, gainers: 0, losers: 0, volume: 0 });
  const searchTimer = useRef(null);

  const loadPage = useCallback(async (pg, append, filterParams) => {
    try {
      const res = await getStocks({
        page: pg,
        limit: PAGE_SIZE,
        live: 1,
        search: filterParams.search?.trim() || undefined,
        exchange: filterParams.exchange === "All" ? undefined : filterParams.exchange,
        sector: filterParams.sector === "All" ? undefined : filterParams.sector,
        sort: filterParams.sort,
      });
      if (res?.data?.success) {
        const list = (res.data.stocks || []).map((s) => ({
          ...s,
          companyName: s.name ?? s.companyName ?? s.symbol,
          price: s.currentPrice ?? s.price ?? 0,
        }));
        setStocks((prev) => (append ? [...prev, ...list] : list));
        setHasMore(pg < (res.data.pagination?.totalPages ?? pg));
        setStats((prev) => ({ ...prev, listed: res.data.pagination?.totalStocks ?? prev.listed }));
        setPage(pg);
      }
    } catch (err) {
      console.error("Failed to load market data:", err);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  const loadMovers = useCallback(async () => {
    try {
      const res = await getStocks({ limit: 500, live: 1 });
      if (!res?.data?.success) return;
      const list = res.data.stocks || [];
      const byChange = (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0);
      const byVolume = (a, b) => (b.volume ?? 0) - (a.volume ?? 0);

      setMovers({
        gainers: [...list].sort(byChange).slice(0, 5),
        losers: [...list].sort(byChange).reverse().slice(0, 5),
        active: [...list].sort(byVolume).slice(0, 5),
      });
      setStats((prev) => ({
        ...prev,
        gainers: list.filter((s) => (s.changePercent ?? 0) > 0).length,
        losers: list.filter((s) => (s.changePercent ?? 0) < 0).length,
        volume: list.reduce((a, s) => a + (s.volume ?? 0), 0),
      }));
    } catch (err) {
      console.error("Failed to load movers:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    loadMovers();

    getStockSectors()
      .then((res) => {
        if (res?.data?.success && Array.isArray(res.data.sectors)) {
          setSectors(res.data.sectors);
        }
      })
      .catch(() => {});
  }, [loadMovers]);

  // Reload the list (from page 1) whenever filters change, debounced.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      loadPage(1, false, filters);
    }, 300);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [filters, loadPage]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadPage(page + 1, true, filters);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <MarketHeader
          marketStatus={getMarketStatus()}
          onSearch={() => setSearchOpen(true)}
          stats={stats}
        />

        <MarketFilters
          filters={filters}
          setFilters={setFilters}
          sectors={sectors}
        />

        <MarketMoversStrip movers={movers} />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Stocks</h2>
            <p className="text-sm text-(--text-secondary)">
              {stats.listed ? `${stats.listed.toLocaleString("en-IN")} listed` : ""}
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl border border-(--border-color) bg-(--surface-1)"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {stocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                />
              ))}
            </div>
          )}

          {!loading && stocks.length === 0 && (
            <p className="py-10 text-center text-(--text-secondary)">No stocks match your filters.</p>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </section>

      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </DashboardLayout>
  );
}
