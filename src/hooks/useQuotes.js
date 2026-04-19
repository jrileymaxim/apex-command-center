import { useState, useEffect, useCallback } from "react";
import { getQuotes } from "../api/polygon";

export function useQuotes(tickers) {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    if (!tickers || !tickers.length) return;
    setLoading(true);
    try {
      const data = await getQuotes(tickers);
      setQuotes(data);
    } catch(e) {
      console.warn("useQuotes error:", e);
    } finally {
      setLoading(false);
    }
  }, [tickers.join(",")]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { quotes, loading, refresh: fetch_ };
}