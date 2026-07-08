import { Bell, Menu, Search, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import SearchModal from "../common/SearchModal.jsx";
import ProfileDropdown from "../common/ProfileDropdown.jsx";

export default function DashboardNavbar({ onMenuClick }) {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-xl supports-[backdrop-filter]:bg-(--bg-primary)/60">

        <div className="mx-auto flex h-18 max-w-[1700px] items-center justify-between px-5 sm:px-6 lg:px-8 xl:px-10">

          {/* Left */}

          <div className="flex items-center gap-4">

            <button
              onClick={onMenuClick}
              className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:bg-(--surface-2) lg:hidden"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex h-11 w-80 items-center justify-between rounded-2xl border border-(--border-color) bg-(--surface-1) px-4 text-sm text-(--text-secondary) transition-all duration-300 hover:border-blue-500/30 hover:bg-(--surface-2)"
            >
              <div className="flex items-center gap-2">
                <Search size={17} />
                <span>Search stocks...</span>
              </div>

              <span className="rounded-lg bg-(--surface-2) px-2 py-1 text-xs font-medium">
                Ctrl K
              </span>
            </button>

          </div>

          {/* Right */}

          <div className="flex items-center gap-3">

            {/* Market Status */}

            <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2">

              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>

              <div>
                <p className="text-xs text-green-500">
                  LIVE
                </p>

                <p className="text-xs text-(--text-secondary)">
                  NSE / BSE
                </p>
              </div>

            </div>

            {/* Notifications */}

            <div className="relative">

              <button
                onClick={() => setAlertsOpen((v) => !v)}
                className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:border-blue-500/30 hover:bg-(--surface-2)"
              >
                <Bell size={18} />
              </button>

              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>

              {alertsOpen && (

                <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-(--border-color) bg-(--bg-secondary) p-4 shadow-2xl">

                  <h3 className="font-semibold">
                    Notifications
                  </h3>

                  <div className="mt-4 space-y-3">

                    <div className="rounded-2xl bg-(--surface-2) p-3">
                      <p className="text-sm">
                        Reliance crossed ₹1,590
                      </p>

                      <p className="mt-1 text-xs text-(--text-secondary)">
                        High trading volume detected.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-(--surface-2) p-3">
                      <p className="text-sm">
                        Bank Nifty holding support.
                      </p>

                      <p className="mt-1 text-xs text-(--text-secondary)">
                        Above 57,200 level.
                      </p>
                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* Profile */}

            <div className="relative">

              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="hidden sm:flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-1) px-3 py-2 transition-all duration-300 hover:border-blue-500/30 hover:bg-(--surface-2)"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">

                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U"}

                </div>

                <div className="text-left">

                  <p className="text-sm font-semibold">
                    {user?.name || "Guest"}
                  </p>

                  <p className="text-xs text-(--text-secondary)">
                    Paper Trader
                  </p>

                </div>

              </button>

              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="rounded-2xl border border-(--border-color) bg-(--surface-1) p-2.5 transition hover:bg-(--surface-2) sm:hidden"
              >
                <UserCircle2 size={20} />
              </button>

              <ProfileDropdown
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
              />

            </div>

          </div>

        </div>

      </header>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}