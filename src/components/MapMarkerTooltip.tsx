export interface MapTooltipLine {
  name: string;
  group: string;
  status: string;
}

export interface MapTooltipPayload {
  x: number;
  y: number;
  lines: MapTooltipLine[];
}

export function MapMarkerTooltip({ payload }: { payload: MapTooltipPayload | null }) {
  if (!payload) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[260px] rounded-lg border border-line bg-panel px-3 py-2 text-xs shadow-lg"
      style={{ left: payload.x + 14, top: payload.y + 14 }}
      role="tooltip"
    >
      <ul className="space-y-1.5">
        {payload.lines.map((line, index) => (
          <li key={`${line.name}-${index}`}>
            <p className="font-medium text-heading">{line.name}</p>
            <p className="text-muted">
              {line.group} · {line.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
