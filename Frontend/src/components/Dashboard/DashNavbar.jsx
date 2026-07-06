import {
  Search,
  Bell,
  UserCircle2,
  Menu,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function DashboardNavbar() {
  const navItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
    },
    {
      title: "Markets",
      path: "/markets",
    },
    {
      title: "Portfolio",
      path: "/portfolio",
    },
    {
      title: "Watchlist",
      path: "/watchlist",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#09090B]/95 backdrop-blur-xl border-b border-zinc-800">

      <div className="max-w-[1600px] mx-auto h-20 px-8 flex items-center justify-between">

        {/* Logo */}

        <div className="flex items-center gap-4">

          <button className="lg:hidden">

            <Menu />

          </button>

          <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold">

            T

          </div>

          <div>

            <h1 className="text-2xl font-bold">

              Trade<span className="text-green-400">Wise</span>

            </h1>

            <p className="text-xs text-gray-500">

              Paper Trading Platform

            </p>

          </div>

        </div>

        {/* Navigation */}

        <nav className="hidden lg:flex items-center gap-10">

          {navItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "text-green-400 font-semibold"
                  : "text-gray-400 hover:text-white transition"
              }
            >
              {item.title}
            </NavLink>
          ))}

        </nav>

        {/* Right */}

        <div className="flex items-center gap-4">

          {/* Search */}

          <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-72">

            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              placeholder="Search Stocks..."
              className="bg-transparent outline-none ml-3 w-full"
            />

          </div>

          {/* Market Status */}

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">

            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

            <span className="text-green-400 text-sm">

              Market Open

            </span>

          </div>

          <button className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">

            <Bell size={19} />

          </button>

          <button className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">

            <UserCircle2 size={22} />

          </button>

        </div>

      </div>

    </header>
  );
}