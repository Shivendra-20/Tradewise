import {
  Newspaper,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";

const demoNews = [
  {
    id: 1,
    title: "Reliance expands renewable energy investments across India",
    source: "Economic Times",
    time: "20 min ago",
    impact: "Positive",
  },
  {
    id: 2,
    title: "Company announces quarterly earnings above expectations",
    source: "Moneycontrol",
    time: "1 hour ago",
    impact: "Positive",
  },
  {
    id: 3,
    title: "Brokerages maintain BUY rating with higher target price",
    source: "CNBC TV18",
    time: "3 hours ago",
    impact: "Neutral",
  },
  {
    id: 4,
    title: "Market volatility increases ahead of RBI policy meeting",
    source: "Business Standard",
    time: "Today",
    impact: "Negative",
  },
];

export default function LatestNews({ news = demoNews }) {
  return (
    <div className="rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-6 shadow-lg">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Newspaper className="text-blue-500" size={24} />
            Latest News
          </h2>

          <p className="mt-1 text-sm text-(--text-secondary)">
            Recent updates related to this company
          </p>

        </div>

        <button className="text-sm font-medium text-blue-500 hover:text-blue-400">
          View All
        </button>

      </div>

      {/* News */}

      <div className="space-y-4">

        {news.map((item) => (
          <button
            key={item.id}
            className="group w-full rounded-2xl border border-(--border-color) bg-(--surface-1) p-5 text-left transition-all duration-300 hover:border-blue-500/30 hover:bg-(--surface-2)"
          >

            <div className="flex items-start justify-between gap-3">

              <h3 className="font-semibold leading-6 group-hover:text-blue-500">
                {item.title}
              </h3>

              <ArrowUpRight
                size={18}
                className="shrink-0 text-(--text-secondary) transition group-hover:text-blue-500"
              />

            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-(--text-secondary)">

              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                {item.source}
              </span>

              <span className="flex items-center gap-1">
                <Clock size={14} />
                {item.time}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.impact === "Positive"
                    ? "bg-green-500/10 text-green-500"
                    : item.impact === "Negative"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {item.impact}
              </span>

            </div>

          </button>
        ))}

      </div>
    </div>
  );
}