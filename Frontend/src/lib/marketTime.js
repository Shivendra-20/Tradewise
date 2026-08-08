// NSE cash market hours: Monday–Friday, 09:15–15:30 IST.
// IST is UTC + 5:30; we shift the current time so the UTC getters read IST wall-clock.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getMarketStatus() {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const day = ist.getUTCDay();
  if (day === 0 || day === 6) return "CLOSED";

  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30) return "OPEN";
  return "CLOSED";
}

export function isMarketOpen() {
  return getMarketStatus() === "OPEN";
}
