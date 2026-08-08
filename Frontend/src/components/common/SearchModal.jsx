import { useEffect, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchStocks } from "../../api/stock.js";

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset query on close
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const token = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const res = await searchStocks(q);
        if (res?.data?.success) {
          setResults(res.data.data || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search failed", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(token);
  }, [query]);

  const fallback = [];
  const display = query.trim() ? results : fallback;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-start justify-center bg-black/70 px-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-4xl border border-(--border-color) bg-(--bg-secondary) p-5 shadow-[0_0_70px_rgba(0,0,0,0.4)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 py-3">
          <Search size={18} className="text-[var(--text-secondary)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or symbol"
            className="w-full bg-transparent text-sm text-(--text-primary) outline-none"
          />
          <button onClick={onClose} className="text-sm text-(--text-secondary)">Esc</button>
        </div>

        <div className="mt-4 space-y-2">
          {loading && <div className="text-sm text-(--text-secondary)">Searching...</div>}
          {display.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                navigate(`/stock/${stock.symbol}`);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 py-3 text-left transition hover:border-green-500"
            >
              <div>
                <p className="font-medium">{stock.symbol}</p>
                <p className="text-sm text-(--text-secondary)">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{stock.currentPrice ? `₹${stock.currentPrice.toLocaleString()}` : "-"}</p>
                <p className={`text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {stock.change >= 0 ? "+" : ""}{stock.change ?? ""}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 py-3 text-sm text-(--text-secondary)">
          <TrendingUp size={16} className="text-green-400" />
          Popular search: RELIANCE, TCS, INFY, BANKING, ENERGY
        </div>
      </div>
    </div>
  );
}
