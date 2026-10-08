export function Sparkline({
  points,
  positive,
  width = 72,
  height = 26,
  strokeWidth = 1.6,
}: {
  points: number[];
  positive: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = strokeWidth;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = pad + (1 - (p - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="overflow-visible"
    >
      <path
        d={d}
        fill="none"
        stroke={positive ? "var(--color-up)" : "var(--color-down)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
