import { useState, useEffect, useCallback } from "react";
import { loadPortfolio, savePortfolio, resetPortfolio } from "../state/portfolio";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(() => loadPortfolio());

  useEffect(() => {
    savePortfolio(portfolio);
  }, [portfolio]);

  const updateTheme = useCallback((id, patch) => {
    setPortfolio(p => ({
      ...p,
      themes: p.themes.map(t => (t.id === id ? { ...t, ...patch } : t))
    }));
  }, []);

  const addPosition = useCallback((position) => {
    setPortfolio(p => ({ ...p, positions: [...p.positions, position] }));
  }, []);

  const removePosition = useCallback((id) => {
    setPortfolio(p => ({
      ...p,
      positions: p.positions.filter(pos => pos.id !== id)
    }));
  }, []);

  const reset = useCallback(() => {
    setPortfolio(resetPortfolio());
  }, []);

  return {
    themes: portfolio.themes,
    positions: portfolio.positions,
    watchlist: portfolio.watchlist ?? [],
    catalysts: portfolio.catalysts ?? [],
    updateTheme,
    addPosition,
    removePosition,
    reset
  };
}
