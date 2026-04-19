export default function Panel({
  children,
  accent,
  className = "",
  onClick,
  as: Component = "div"
}) {
  const style = accent ? { "--panel-accent": accent } : undefined;
  const classes = [
    "hud-panel",
    onClick ? "hud-panel-interactive" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <Component className={classes} style={style} onClick={onClick}>
      <span className="hud-corner hud-corner-tl" aria-hidden="true" />
      <span className="hud-corner hud-corner-tr" aria-hidden="true" />
      <span className="hud-corner hud-corner-bl" aria-hidden="true" />
      <span className="hud-corner hud-corner-br" aria-hidden="true" />
      <div className="hud-panel-body">{children}</div>
    </Component>
  );
}
