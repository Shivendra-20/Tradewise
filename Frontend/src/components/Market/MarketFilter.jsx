import { Search, RotateCcw } from "lucide-react";

const exchanges = ["All", "NSE", "BSE"];

const sectors = [
  "All",
  "Banking",
  "IT",
  "Energy",
  "Pharma",
  "Auto",
  "FMCG",
  "Metal",
  "Finance",
];

const sortOptions = [
  "Market Cap",
  "Price ↑",
  "Price ↓",
  "% Change",
  "Volume",
];

export default function MarketFilters({
  filters,
  setFilters,
}) {
  function handleChange(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      exchange: "All",
      sector: "All",
      sort: "Market Cap",
    });
  }

  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-5">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

        {/* Search */}

        <div className="relative flex-1">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary)"
          />

          <input
            type="text"
            placeholder="Search company..."
            value={filters.search}
            onChange={(e) =>
              handleChange("search", e.target.value)
            }
            className="h-12 w-full rounded-2xl border border-(--border-color) bg-(--surface-1) pl-11 pr-4 outline-none transition focus:border-blue-500"
          />

        </div>

        {/* Exchange */}

        <select
          value={filters.exchange}
          onChange={(e) =>
            handleChange("exchange", e.target.value)
          }
          className="h-12 rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 outline-none"
        >
          {exchanges.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        {/* Sector */}

        <select
          value={filters.sector}
          onChange={(e) =>
            handleChange("sector", e.target.value)
          }
          className="h-12 rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 outline-none"
        >
          {sectors.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        {/* Sort */}

        <select
          value={filters.sort}
          onChange={(e) =>
            handleChange("sort", e.target.value)
          }
          className="h-12 rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 outline-none"
        >
          {sortOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        {/* Reset */}

        <button
          onClick={resetFilters}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-(--border-color) bg-(--surface-1) px-5 transition hover:bg-(--surface-2)"
        >
          <RotateCcw size={17} />
          Reset
        </button>

      </div>
    </div>
  );
}