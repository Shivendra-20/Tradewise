import { useEffect, useState } from "react";
import { Search, RefreshCw, XCircle, ShoppingBag, CheckCircle, AlertCircle, Ban } from "lucide-react";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import Card from "../components/common/Card.jsx";
import { formatCurrency } from "../lib/formatters.js";
import api from "../api/axios.js"; // Adjust the path as per your project structure

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // 1. Fetch Orders from Backend (Fixed Response Mapping Bug)
  async function fetchOrders() {
    try {
      setLoading(true);
      setError(false);
      const res = await api.get("/api/orders");
      // Fixed: Now accurately targeting res.data.data as per your backend controller
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchOrders();
  }, []);

  // 3. Cancel Order Handler
  async function handleCancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.patch(`/api/orders/cancel/${orderId}`);
      fetchOrders(); // Refresh data after successful cancellation
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Could not cancel the order. Please try again.");
    }
  }

  // 5. Summary Cards Counter Logic
  const totalOrders = orders.length;
  const completedCount = orders.filter((o) => o.status?.toLowerCase() === "completed").length;
  const pendingCount = orders.filter((o) => o.status?.toLowerCase() === "pending").length;
  const cancelledCount = orders.filter((o) => o.status?.toLowerCase() === "cancelled").length;

  // 4. Search and Filter Logic
  const filteredOrders = orders.filter((order) => {
    const symbol = order.stockId?.symbol?.toLowerCase() || "";
    const name = order.stockId?.name?.toLowerCase() || "";
    const searchMatch = symbol.includes(search.toLowerCase()) || name.includes(search.toLowerCase());

    if (filter === "All") return searchMatch;
    if (filter === "Buy") return order.type?.toLowerCase() === "buy" && searchMatch;
    if (filter === "Sell") return order.type?.toLowerCase() === "sell" && searchMatch;
    
    return order.status?.toLowerCase() === filter.toLowerCase() && searchMatch;
  });

  // 8. Badge Styling Functions
  const getTypeBadgeClass = (type) => {
    return type?.toLowerCase() === "buy"
      ? "bg-green-500/10 text-green-400 border border-green-500/20"
      : "bg-red-500/10 text-red-400 border border-red-500/20";
  };

  const getOrderTypeBadgeClass = (orderType) => {
    return orderType?.toLowerCase() === "market"
      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      : "bg-purple-500/10 text-purple-400 border border-purple-500/20";
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Order Book</h1>
          <p className="mt-2 text-sm text-(--text-secondary)">
            Monitor your trade history, tracking active pending triggers and historic completions.
          </p>
        </div>

        {/* 5. Summary Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-(--text-secondary)">Total Orders</p>
              <ShoppingBag size={18} className="text-blue-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : totalOrders}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-(--text-secondary)">Completed</p>
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : completedCount}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-(--text-secondary)">Pending</p>
              <AlertCircle size={18} className="text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : pendingCount}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-(--text-secondary)">Cancelled</p>
              <Ban size={18} className="text-red-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{loading ? "—" : cancelledCount}</p>
          </Card>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl bg-(--surface-2) p-1 border border-(--border-color)">
            {["All", "Buy", "Sell", "Pending", "Completed", "Cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === tab
                    ? "bg-green-500 text-black font-semibold"
                    : "text-(--text-secondary) hover:text-(--text-main)"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-(--border-color) bg-(--surface-1) py-2 pr-4 pl-9 text-sm text-(--text-main) placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* 7. Orders Layout Data Table */}
        <Card>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              Failed to refresh orders.
              <button onClick={fetchOrders} className="ml-auto flex items-center gap-1 font-medium hover:underline">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* 2. Loading State (Skeletons) */}
          {loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-(--text-secondary) border-b border-(--border-color)">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Order Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Created At</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-(--border-color)">
                      <td colSpan={9} className="py-4">
                        <div className="h-5 w-full animate-pulse rounded bg-(--surface-2)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : /* 3. Empty State */
          filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--border-color) p-12 text-center">
              <p className="text-base font-medium text-(--text-main)">No Orders Found</p>
              <p className="mt-1 text-sm text-(--text-secondary)">Place your first trade to populate your portfolio log.</p>
            </div>
          ) : (
            /* 7. Orders Table Grid Data View */
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm alignment-middle">
                <thead className="text-(--text-secondary)">
                  <tr className="border-b border-(--border-color)">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Order Type</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Created At</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border-color)">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-(--surface-2)/40 transition-colors">
                      {/* Company Name & Ticker */}
                      <td className="py-4 pr-2">
                        <div className="font-semibold text-(--text-main)">{order.stockId?.symbol || "—"}</div>
                        <div className="text-xs text-(--text-secondary) max-w-[150px] truncate">
                          {order.stockId?.name || "—"}
                        </div>
                      </td>

                      {/* Order Action Badge */}
                      <td className="py-4 pr-2">
                        <span className={`rounded px-2 py-0.5 text-xxs font-bold tracking-wide uppercase ${getTypeBadgeClass(order.type)}`}>
                          {order.type}
                        </span>
                      </td>

                      {/* Order Pricing Mechanics Badge */}
                      <td className="py-4 pr-2">
                        <span className={`rounded px-2 py-0.5 text-xxs font-medium ${getOrderTypeBadgeClass(order.orderType)}`}>
                          {order.orderType}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 pr-2 text-right font-medium">{order.quantity}</td>

                      {/* Execution/Limit Pricing */}
                      <td className="py-4 pr-2 text-right font-mono">{formatCurrency(order.price)}</td>

                      {/* 2. Total Evaluation (Added Safe Fallback Formula) */}
                      <td className="py-4 pr-2 text-right font-mono font-medium text-zinc-200">
                        {formatCurrency(order.totalValue || (order.quantity * order.price))}
                      </td>

                      {/* Processing Status Badge */}
                      <td className="py-4 pr-2 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium inline-block min-w-[85px] ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Added/Updated: Created At Log Timestamp Column */}
                      <td className="py-4 pr-2 text-xs text-(--text-secondary) whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </td>

                      {/* Cancel Command Call Interface */}
                      <td className="py-4 text-right">
                        {order.status?.toLowerCase() === "pending" ? (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500 hover:text-black transition"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}