import { useSelector } from "react-redux";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";

function Profile() {
  const { user } = useSelector((state) => state.auth);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 rounded-[2rem] border border-(--border-color) bg-(--surface-1) p-8 shadow-[0_0_60px_rgba(34,197,94,0.08)]">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-green-400">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold">{user?.name || "TradeWise User"}</h1>
          <p className="mt-2 text-sm text-(--text-secondary)">Manage your demo trading identity and portfolio overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-(--border-color) bg-(--surface-2) p-5">
            <p className="text-sm text-(--text-secondary)">Email</p>
            <p className="mt-2 font-semibold">{user?.email || "guest@tradewise.app"}</p>
          </div>
          <div className="rounded-2xl border border-(--border-color) bg-(--surface-2) p-5">
            <p className="text-sm text-(--text-secondary)">Member since</p>
            <p className="mt-2 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Today"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-sm text-green-300">
          <p className="font-semibold">Portfolio status</p>
          <p className="mt-2 text-zinc-400">You are currently tracking a balanced paper trading basket with real-time updates enabled.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile