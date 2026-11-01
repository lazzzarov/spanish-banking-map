/**
 * Flat illustrations for the seven era panels. Drawn with theme variables so they follow
 * light and dark mode; purely decorative (the panel text carries the meaning).
 */
const INK = "var(--heading)";
const PAPER = "var(--panel)";
const SKY = "var(--panel-2)";
const ACCENT = "var(--accent)";
const DEAL = "var(--deal)";
const SOFT = "var(--line)";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 110" className="block w-full" style={{ background: SKY }}>
      {children}
      <line x1="12" y1="92" x2="188" y2="92" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

/** 1920–35: the bank hall and the 1921 law. */
function LawEra() {
  return (
    <Frame>
      <rect x="60" y="40" width="80" height="50" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M52 40 L100 18 L148 40 Z" fill={PAPER} stroke={INK} strokeWidth="2" />
      <g stroke={INK} strokeWidth="2">
        <line x1="74" y1="48" x2="74" y2="84" />
        <line x1="90" y1="48" x2="90" y2="84" />
        <line x1="110" y1="48" x2="110" y2="84" />
        <line x1="126" y1="48" x2="126" y2="84" />
      </g>
      <rect x="148" y="58" width="30" height="36" fill={PAPER} stroke={ACCENT} strokeWidth="2" transform="rotate(8 163 76)" />
      <g stroke={ACCENT} strokeWidth="1.5">
        <line x1="154" y1="66" x2="172" y2="69" />
        <line x1="153" y1="72" x2="171" y2="75" />
        <line x1="152" y1="78" x2="166" y2="80" />
      </g>
    </Frame>
  );
}

/** 1936–59: a divided system under lock. */
function LockedEra() {
  return (
    <Frame>
      <rect x="40" y="44" width="56" height="46" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="104" y="44" width="56" height="46" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M100 30 L100 96" stroke={DEAL} strokeWidth="3" strokeDasharray="6 5" />
      <rect x="118" y="58" width="28" height="22" fill={SOFT} stroke={INK} strokeWidth="2" />
      <path d="M124 58 v-8 a8 8 0 0 1 16 0 v8" fill="none" stroke={INK} strokeWidth="2" />
    </Frame>
  );
}

/** 1960–77: branches spread across the country. */
function OpeningEra() {
  return (
    <Frame>
      <g fill={PAPER} stroke={INK} strokeWidth="2">
        <rect x="22" y="58" width="30" height="32" />
        <rect x="62" y="50" width="30" height="40" />
        <rect x="102" y="58" width="30" height="32" />
        <rect x="142" y="46" width="34" height="44" />
      </g>
      <g fill={ACCENT}>
        <rect x="31" y="66" width="12" height="8" />
        <rect x="71" y="58" width="12" height="8" />
        <rect x="111" y="66" width="12" height="8" />
        <rect x="153" y="54" width="12" height="8" />
      </g>
      <path d="M24 30 Q100 6 176 30" fill="none" stroke={ACCENT} strokeWidth="2" />
      <path d="M170 24 L177 30 L168 33" fill="none" stroke={ACCENT} strokeWidth="2" />
    </Frame>
  );
}

/** 1978–87: a cracked façade and a rescue. */
function CrisisEra() {
  return (
    <Frame>
      <rect x="60" y="34" width="80" height="56" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M104 34 L96 52 L108 62 L98 90" fill="none" stroke={DEAL} strokeWidth="3" />
      <path d="M140 52 Q160 40 172 56" fill="none" stroke={INK} strokeWidth="2" />
      <circle cx="176" cy="66" r="10" fill={PAPER} stroke={ACCENT} strokeWidth="2" />
      <path d="M176 56 v20 M166 66 h20" stroke={ACCENT} strokeWidth="2" />
    </Frame>
  );
}

/** 1988–2007: two towers join. */
function GiantsEra() {
  return (
    <Frame>
      <rect x="46" y="30" width="36" height="60" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="118" y="22" width="36" height="68" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M82 50 H118" stroke={ACCENT} strokeWidth="4" />
      <circle cx="100" cy="50" r="7" fill={ACCENT} />
      <g fill={SOFT}>
        <rect x="54" y="38" width="8" height="8" />
        <rect x="66" y="38" width="8" height="8" />
        <rect x="126" y="30" width="8" height="8" />
        <rect x="138" y="30" width="8" height="8" />
      </g>
    </Frame>
  );
}

/** 2008–12: many cajas pulled into one new bank. */
function CajasEra() {
  return (
    <Frame>
      <g fill={PAPER} stroke={INK} strokeWidth="2">
        <rect x="18" y="56" width="26" height="34" />
        <rect x="52" y="56" width="26" height="34" />
        <rect x="86" y="56" width="26" height="34" />
        <rect x="120" y="56" width="26" height="34" />
      </g>
      <path
        d="M31 56 Q100 20 172 44 M65 56 Q110 26 172 44 M99 56 Q130 32 172 44 M133 56 Q150 40 172 44"
        fill="none"
        stroke={DEAL}
        strokeWidth="1.6"
      />
      <rect x="156" y="38" width="32" height="52" fill={ACCENT} stroke={INK} strokeWidth="2" />
    </Frame>
  );
}

/** 2013–26: a few big groups on a phone, and the €1 sale. */
function DigitalEra() {
  return (
    <Frame>
      <rect x="80" y="18" width="40" height="72" rx="7" fill={PAPER} stroke={INK} strokeWidth="2" />
      <circle cx="94" cy="44" r="7" fill="#e11d48" />
      <circle cx="108" cy="44" r="7" fill="#1f6feb" />
      <circle cx="94" cy="60" r="7" fill="#6d28d9" />
      <circle cx="108" cy="60" r="7" fill="#059669" />
      <circle cx="148" cy="44" r="13" fill={PAPER} stroke={DEAL} strokeWidth="2" />
      <text x="148" y="49" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill={DEAL}>
        €1
      </text>
    </Frame>
  );
}

export const ERA_ART: Record<string, () => React.ReactElement> = {
  "1920-1935": LawEra,
  "1936-1959": LockedEra,
  "1960-1977": OpeningEra,
  "1978-1987": CrisisEra,
  "1988-2007": GiantsEra,
  "2008-2012": CajasEra,
  "2013-2026": DigitalEra,
};
