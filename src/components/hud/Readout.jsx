export default function Readout({ label, value, trend }) {
  const trendClass =
    trend === "up" ? "hud-readout-up" :
    trend === "down" ? "hud-readout-down" : "";

  return (
    <div className={`hud-readout ${trendClass}`}>
      <div className="hud-readout-label">{label}</div>
      <div className="hud-readout-value">{value}</div>
    </div>
  );
}
