export default function Badge({ variant = "default", children, icon }) {
  return (
    <span className={`hud-badge hud-badge-${variant}`}>
      {icon && <span className="hud-badge-icon" aria-hidden="true">{icon}</span>}
      <span className="hud-badge-text">{children}</span>
    </span>
  );
}
