import { useEffect, useRef } from "react";
import {
  User,
  Wallet,
  Star,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api/axios.js";

export default function ProfileDropdown({
  open,
  onClose,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const dropdownRef = useRef(null);

  const { theme, toggleTheme } = useTheme();

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  const menu = [
    {
      title: "View Profile",
      icon: User,
      action: () => {
        navigate("/profile");
        onClose();
      },
    },

    {
      title: "Portfolio",
      icon: Wallet,
      action: () => {
        navigate("/portfolio");
        onClose();
      },
    },

    {
      title: "Watchlist",
      icon: Star,
      action: () => {
        navigate("/watchlist");
        onClose();
      },
    },
  ];

async function handleLogout() {
  try {
    await api.post("/api/auth/logout");
  } catch (err) {
    console.error("Logout failed:", err);
  }

  dispatch(logout());

  navigate("/login");
}

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 w-80 rounded-3xl border border-(--border-color) bg-(--bg-secondary) shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}

      <div className="border-b border-(--border-color) p-6">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>

            <h3 className="font-semibold text-(--text-primary)">
              {user?.name || "Guest User"}
            </h3>

            <p className="mt-1 text-sm text-(--text-secondary)">
              {user?.email}
            </p>

          </div>

        </div>

      </div>

      {/* Menu */}

      <div className="p-2">

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              onClick={item.action}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-(--surface-2)"
            >
              <div className="flex items-center gap-3">

                <Icon
                  size={18}
                  className="text-blue-500"
                />

                <span className="text-sm font-medium">
                  {item.title}
                </span>

              </div>

              <ChevronRight size={16} />
            </button>
          );
        })}

        {/* Theme */}

        <button
          onClick={toggleTheme}
          className="mt-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-(--surface-2)"
        >
          <div className="flex items-center gap-3">

            {theme === "dark" ? (
              <Sun
                size={18}
                className="text-amber-400"
              />
            ) : (
              <Moon
                size={18}
                className="text-indigo-500"
              />
            )}

            <span className="text-sm font-medium">
              {theme === "dark"
                ? "Light Mode"
                : "Dark Mode"}
            </span>

          </div>
        </button>

      </div>

      {/* Footer */}

      <div className="border-t border-(--border-color) p-3">

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 font-medium text-white transition hover:bg-red-600"
        >
          <LogOut size={18} />

          Logout

        </button>

      </div>
    </div>
  );
}