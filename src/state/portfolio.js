import seed from "../seed/portfolio.json";

const STORAGE_KEY = "apex-portfolio-v2";

/**
 * Load portfolio from localStorage, fall back to seed.
 * Shallow-merges seed defaults so new fields added in future
 * don't nuke existing user data.
 */
export function loadPortfolio() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const stored = JSON.parse(raw);
    return {
      ...seed,
      ...stored,
      themes: stored.themes ?? seed.themes,
      positions: stored.positions ?? seed.positions,
      watchlist: stored.watchlist ?? seed.watchlist,
      catalysts: stored.catalysts ?? seed.catalysts
    };
  } catch (e) {
    console.warn("Portfolio load failed, using seed:", e);
    return structuredClone(seed);
  }
}

export function savePortfolio(portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (e) {
    console.error("Portfolio save failed:", e);
  }
}

export function resetPortfolio() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(seed);
}
