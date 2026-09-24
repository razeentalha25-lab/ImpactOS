import { useEffect, useState } from "react";

export default function Counter({ end = 0, duration = 1400, decimals = 0, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  const num = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span className="font-mono-stat">{prefix}{num}{suffix}</span>;
}
