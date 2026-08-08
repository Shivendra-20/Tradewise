import { io } from "socket.io-client";
import { useSyncExternalStore } from "react";

const API_URI = import.meta.env.VITE_API_URI || "http://localhost:5000";

let socket = null;
let connectAttempted = false;

const quoteStore = new Map(); // symbol -> latest tick
const listeners = new Set();  // store change callbacks
const requestedSymbols = new Set();

function notify() {
  listeners.forEach((cb) => cb());
}

function onConnect() {
  if (requestedSymbols.size > 0) {
    socket.emit("subscribe:stocks", Array.from(requestedSymbols));
  }
}

export function getSocket() {
  if (socket || connectAttempted) return socket;
  connectAttempted = true;

  const token = localStorage.getItem("token");

  socket = io(API_URI, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5,
  });

  socket.on("connect", onConnect);

  socket.on("market:tick", (payload) => {
    const ticks = Array.isArray(payload?.ticks) ? payload.ticks : [];
    let changed = false;

    for (const tick of ticks) {
      if (!tick?.symbol) continue;
      quoteStore.set(tick.symbol.toUpperCase(), tick);
      changed = true;
    }

    if (changed) notify();
  });

  socket.on("connect_error", (err) => {
    if (err?.message === "Unauthorized") {
      socket?.disconnect();
      socket = null;
      connectAttempted = false;
    }
  });

  return socket;
}

export function subscribeToQuotes(cb) {
  getSocket();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getLiveQuote(symbol) {
  if (!symbol) return null;
  return quoteStore.get(String(symbol).toUpperCase()) || null;
}

export function subscribeSymbols(symbols) {
  const list = (Array.isArray(symbols) ? symbols : [symbols])
    .filter(Boolean)
    .map((s) => String(s).toUpperCase());

  if (list.length === 0) return;

  list.forEach((s) => requestedSymbols.add(s));

  const s = getSocket();
  if (s?.connected) {
    s.emit("subscribe:stocks", list);
  }
}

export function unsubscribeSymbols(symbols) {
  const list = (Array.isArray(symbols) ? symbols : [symbols]).filter(Boolean);
  list.forEach((s) => requestedSymbols.delete(s?.toUpperCase?.()));

  if (socket?.connected && list.length > 0) {
    socket.emit("unsubscribe:stocks", list);
  }
}

export function useLiveQuote(symbol) {
  const normalized = symbol ? String(symbol).toUpperCase() : "";
  return useSyncExternalStore(subscribeToQuotes, () => getLiveQuote(normalized));
}
