import { useEffect, useRef, useState } from "react";

/**
 * Animated number that eases from previous value to current.
 * Used for live price displays.
 */
export default function Ticker({ value, formatter = String, durationMs = 300 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value == null || value === prevRef.current) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }

    const start = prevRef.current ?? value;
    const end = value;
    const startTime = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = end;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <span className="hud-ticker">{formatter(display)}</span>;
}
