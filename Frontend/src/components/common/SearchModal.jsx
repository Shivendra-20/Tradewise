import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stockCatalog = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 1586.4, change: 2.31, sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3982.2, change: 1.84, sector: "Technology" },
  { symbol: "INFY", name: "Infosys", price: 1742.5, change: -0.52, sector: "Technology" },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1923.6, change: 0.92, sector: "Banking" },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1488.1, change: 1.22, sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", price: 845.75, change: -1.02, sector: "Banking" },
  { symbol: "LT", name: "Larsen & Toubro", price: 3514.8, change: -1.36, sector: "Infra" },
  { symbol: "ADANIENT", name: "Adani Enterprises", price: 2487.3, change: -2.91, sector: "Conglomerate" },
];

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return stockCatalog.slice(0, 6);
    return stockCatalog.filter((stock) =>
      `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

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
          {results.map((stock) => (
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
                <p className="font-medium">₹{stock.price.toLocaleString()}</p>
                <p className={`text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {stock.change >= 0 ? "+" : ""}{stock.change}%
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
