export type EntityType = "caja" | "bank";
export type EntityStatus = "active" | "absorbed" | "rebranded" | "resolved";
export type Mechanism =
  | "sip"
  | "merger"
  | "absorption"
  | "activity_transfer"
  | "resolution"
  | "rebrand"
  | "minority_stake"
  | "bid_failed";
export type EventOutcome = "completed" | "failed" | "announced";

export interface Entity {
  id: string;
  name: string;
  name_es?: string;
  type: EntityType;
  founded: number | null;
  status: EntityStatus;
  region: string | null;
  hq: [number, number] | null;
  src: string;
  group_role?: "featured_head" | "foreign_shareholder";
}

export interface Event {
  id: string;
  from: string;
  to: string;
  year: number;
  mechanism: Mechanism;
  outcome: EventOutcome;
  lineage: boolean;
  ownership_pct?: number | null;
  src: string;
  note?: string | null;
}

export interface DatasetMeta {
  dataset: string;
  version: string;
  as_of: string;
  scope: string;
}

export interface BankDataset {
  meta: DatasetMeta;
  entities: Entity[];
  events: Event[];
}

export interface SourceRecord {
  id: string;
  url: string | null;
  title: string;
  title_es: string;
  publisher: string;
  note?: string;
}

export type Locale = "en" | "es";

export const FEATURED_GROUPS = [
  "caixabank",
  "santander",
  "bbva",
  "sabadell",
  "unicaja",
  "ibercaja",
  "kutxabank",
  "abanca",
] as const;

export type FeaturedGroup = (typeof FEATURED_GROUPS)[number];

export const GROUP_COLORS: Record<FeaturedGroup, string> = {
  caixabank: "#7dd3fc",
  santander: "#fb7185",
  bbva: "#c4b5fd",
  sabadell: "#34d399",
  unicaja: "#fbbf24",
  ibercaja: "#f9a8d4",
  kutxabank: "#38bdf8",
  abanca: "#d8b4fe",
};

export const MECHANISM_LINEAGE: Record<Mechanism, boolean> = {
  sip: true,
  merger: true,
  absorption: true,
  activity_transfer: true,
  resolution: true,
  rebrand: true,
  minority_stake: false,
  bid_failed: false,
};
