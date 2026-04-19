export const fmtUSD = (n, { compact = false, showSign = false } = {}) => {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = showSign && n > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
  return sign + formatted;
};

export const fmtPct = (n, { showSign = true } = {}) => {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = showSign && n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(2)}%`;
};

export const fmtShares = (n) => {
  if (n == null) return "—";
  if (Number.isInteger(n)) return `${n} sh`;
  // trim trailing zeros past 4 decimals
  return `${n.toFixed(4).replace(/\.?0+$/, "")} sh`;
};

export const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
};

export const fmtDateTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

export const daysBetween = (a, b) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.ceil(ms / 86_400_000);
};
