import { useState, useEffect } from "react";
import { getQuotes } from "../api/polygon";

/**
 * Fetch quotes for a list of tickers, polling every intervalMs.
 * Re-runs when the set of tickers changes.
 */
export function useQuotes(tickers, intervalMs = 30_000) {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable key so effect doesn't thrash on every render when array identity changes
  const tickersKey = [...new Set(tickers)].sort().join(",");

  useEffect(() => {
    if (!tickersKey) {
      setQuotes({});
      setLoading(false);
      return;
    }

    let mounted = true;
    const list = tickersKey.split(",");

    const run = async () => {
      try {
        const data = await getQuotes(list);
        if (mounted) {
          setQuotes(data);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e);
          setLoading(false);
        }
      }
    };

    run();
    const id = setInterval(run, intervalMs);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tickersKey, intervalMs]);

  return { quotes, loading, error };
}
