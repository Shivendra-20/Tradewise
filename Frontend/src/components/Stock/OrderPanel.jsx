import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Layers3,
} from "lucide-react";
import api from "../../api/axios.js"
import { useLiveQuote } from "../../lib/realtime.js";

export default function OrderPanel({ stock }) {
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock?.price || 0);

  const live = useLiveQuote(stock?.symbol);
  const marketPrice = live?.price ?? stock?.price ?? 0;

  const executionPrice =
    orderType === "MARKET" ? marketPrice : limitPrice;

  const total = useMemo(
    () => executionPrice * quantity,
    [executionPrice, quantity]
  );

const placeOrder = async () => {

  try {

    const payload = {
      stockId: stock._id,
      type: side.toLowerCase(), // buy | sell
      orderType: orderType.toLowerCase(), // market | limit
      quantity,
      price: orderType === "MARKET" ? marketPrice : limitPrice,
    };


    const res = await api.post("/api/orders", payload);

    alert(res.data.message);

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Order failed");
  }
};

  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-xl font-semibold">
            Place Order
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Buy or Sell this stock
          </p>

        </div>

        <div className="rounded-xl bg-green-500/10 p-3">

          <Wallet
            size={20}
            className="text-green-500"
          />

        </div>

      </div>

      {/* Buy Sell */}

      <div className="mt-6 grid grid-cols-2 gap-3">

        <button
          onClick={() => setSide("BUY")}
          className={`rounded-2xl py-3 font-semibold transition ${
            side === "BUY"
              ? "bg-green-500 text-black"
              : "bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowUpRight size={18} />
            Buy
          </div>
        </button>

        <button
          onClick={() => setSide("SELL")}
          className={`rounded-2xl py-3 font-semibold transition ${
            side === "SELL"
              ? "bg-red-500 text-white"
              : "bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowDownRight size={18} />
            Sell
          </div>
        </button>

      </div>

      {/* Order Type */}

      <div className="mt-6">

        <label className="mb-2 block text-sm text-[var(--text-secondary)]">
          Order Type
        </label>

        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 outline-none"
        >
          <option value="MARKET">
            Market Order
          </option>

          <option value="LIMIT">
            Limit Order
          </option>

        </select>

      </div>

      {/* Quantity */}

      <div className="mt-5">

        <label className="mb-2 block text-sm text-[var(--text-secondary)]">
          Quantity
        </label>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) =>
            setQuantity(Number(e.target.value))
          }
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 outline-none"
        />

      </div>

      {/* Limit Price */}

      {orderType === "LIMIT" && (

        <div className="mt-5">

          <label className="mb-2 block text-sm text-[var(--text-secondary)]">
            Limit Price
          </label>

          <input
            type="number"
            value={limitPrice}
            onChange={(e) =>
              setLimitPrice(Number(e.target.value))
            }
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 outline-none"
          />

        </div>

      )}

      {/* Summary */}

      <div className="mt-6 rounded-2xl bg-[var(--surface-1)] p-4">

        <div className="mb-3 flex items-center gap-2">

          <Layers3
            size={18}
            className="text-blue-500"
          />

          <span className="font-semibold">
            Order Summary
          </span>

        </div>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              Price
            </span>

            <span>
              ₹{executionPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              Quantity
            </span>

            <span>{quantity}</span>
          </div>

          <div className="flex justify-between border-t border-[var(--border-color)] pt-3 text-base font-semibold">

            <span>Total</span>

            <span>
              ₹{total.toLocaleString("en-IN")}
            </span>

          </div>

        </div>

      </div>

      {/* Button */}

      <button
        onClick={placeOrder}
        className={`mt-6 w-full rounded-2xl py-3 font-semibold transition ${
          side === "BUY"
            ? "bg-green-500 text-black hover:bg-green-400"
            : "bg-red-500 text-white hover:bg-red-400"
        }`}
      >
        {side === "BUY"
          ? "Buy Stock"
          : "Sell Stock"}
      </button>

    </div>
  );
}