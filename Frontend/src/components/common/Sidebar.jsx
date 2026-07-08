import {
  BarChart3,
  Compass,
  LayoutGrid,
  Moon,
  Sun,
  TrendingUp,
  Wallet,
  Eye,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";

const navItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Markets",
    path: "/markets",
    icon: Compass,
  },
  {
    title: "Portfolio",
    path: "/portfolio",
    icon: Wallet,
  },
  {
    title: "Watchlist",
    path: "/watchlist",
    icon: Eye,
  },
];

export default function Sidebar({ open, onClose }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[290px] border-r border-(--border-color) bg-(--bg-secondary)/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              onClick={() => {
                onClose?.();
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-red-500 to-cyan-400 text-lg font-bold text-white shadow-lg">
                T
              </div>

              <div>
                <h2 className="text-lg font-bold text-(--text-primary)">
                  TradeWise
                </h2>

                <p className="text-xs text-(--text-secondary)">
                  Paper Trading Platform
                </p>
              </div>
            </Link>

            <button
              onClick={toggleTheme}
              className="rounded-xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:bg-(--surface-2)"
            >
              {theme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-10 space-y-2">
            {navItems.map(({ title, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                      : "text-(--text-secondary) hover:translate-x-1 hover:bg-(--surface-2) hover:text-(--text-primary)"
                  }`
                }
              >
                <Icon size={19} />
                {title}
              </NavLink>
            ))}
          </nav>

          <div className="my-8 h-px bg-(--border-color)" />

          {/* Market Pulse */}
          <div className="rounded-3xl border border-blue-500/15 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent p-5">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className="text-blue-400"
              />

              <span className="font-semibold text-blue-400">
                Market Pulse
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-(--text-secondary)">
              Keep track of market momentum, trends and live movements
              throughout the trading session.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-(--border-color) bg-(--surface-1) p-4">
            <div className="flex items-center gap-3">
              <BarChart3
                size={18}
                className="text-blue-400"
              />

              <div>
                <p className="font-medium">
                  Live Analytics
                </p>

                <p className="text-xs text-(--text-secondary)">
                  Real-time market insights
                </p>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}