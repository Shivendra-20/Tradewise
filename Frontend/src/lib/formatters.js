export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatCompactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);

export const formatPercent = (value) => {
  const rounded = Number(value ?? 0).toFixed(2);
  return `${Number(rounded) >= 0 ? "+" : ""}${rounded}%`;
};
