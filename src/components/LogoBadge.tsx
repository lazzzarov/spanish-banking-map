import { useMemo, useState } from "react";
import { groupColor } from "../lib/bankGraph";
import { withBase } from "../lib/baseUrl";

export function LogoBadge({
  id,
  name,
  groupId,
  size = 36,
}: {
  id: string;
  name: string;
  groupId: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const svgSrc = useMemo(() => withBase(`/logos/${id}.svg`), [id]);
  const pngSrc = useMemo(() => withBase(`/logos/${id}.png`), [id]);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white"
      style={{ width: size, height: size, background: groupColor(groupId) }}
      aria-hidden="true"
    >
      {initials || id.slice(0, 2).toUpperCase()}
      {!failed && (
        <img
          src={svgSrc}
          alt=""
          width={size}
          height={size}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            const img = event.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = pngSrc;
              return;
            }
            setFailed(true);
          }}
        />
      )}
    </span>
  );
}
