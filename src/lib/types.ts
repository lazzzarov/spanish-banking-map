export type EntityType = "caja" | "bank";
export type EntityStatus =
  | "active"
  | "absorbed"
  | "rebranded"
  | "resolved"
  | "historical_nonbank";
export type LegalStatus =
  | "active"
  | "absorbed"
  | "rebranded"
  | "resolved"
  | "historical_nonbank";
export type BankingBusinessStatus = "active" | "transferred" | "absorbed" | "resolved";
export type DatePrecision = "day" | "month" | "year";
export type Mechanism =
  | "sip_formation"
  | "merger"
  | "absorption"
  | "banking_business_transfer"
  | "resolution"
  | "resolution_sale"
  | "rebrand"
  | "acquisition"
  | "intervention"
  | "minority_equity_investment"
  | "failed_acquisition_attempt"
  | "asset_transfer"
  | "divestment";
export type EventOutcome = "completed" | "failed" | "announced";
export type GraphLayer = "business" | "ownership" | "asset" | "context";
export type VerificationStatus =
  | "Verified — Primary Source"
  | "Verified — Company disclosure"
  | "Secondary"
  | "Unverified";

export interface Entity {
  id: string;
  name: string;
  name_es?: string;
  aliases?: string[];
  legal_name?: string;
  type: EntityType;
  founded: number | null;
  founded_precision?: DatePrecision;
  status: EntityStatus;
  legal_status?: LegalStatus;
  banking_business_status?: BankingBusinessStatus;
  region: string | null;
  hq: [number, number] | null;
  src: string;
  group_role?: "featured_head" | "foreign_shareholder" | "independent_caja" | "asset_vehicle";
  publication_ready?: boolean;
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
  announcement_date?: string | null;
  effective_date?: string | null;
  date_precision?: DatePrecision;
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
  verification_status?: VerificationStatus;
}

export interface ContextEvent {
  id: string;
  name: string;
  name_es: string;
  date_start: string;
  year: number;
  era: string;
  category: "regulation" | "crisis" | "restructuring" | "european" | "market";
  description: string;
  description_es: string;
  related_entities: string[];
  sources: string[];
}

export interface StatPoint {
  id: string;
  series: string;
  label: string;
  label_es: string;
  value: number;
  unit: string;
  date: string;
  definition: string;
  definition_es: string;
  src: string;
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
  sip_formation: true,
  merger: true,
  absorption: true,
  banking_business_transfer: true,
  resolution: true,
  resolution_sale: true,
  rebrand: true,
  acquisition: true,
  intervention: false,
  minority_equity_investment: false,
  failed_acquisition_attempt: false,
  asset_transfer: false,
  divestment: false,
};

export const NON_LINEAGE_ALWAYS: Mechanism[] = [
  "minority_equity_investment",
  "failed_acquisition_attempt",
  "asset_transfer",
  "divestment",
  "intervention",
];

export const ERAS = [
  { id: "1920-1935", from: 1920, to: 1935, label: "1920–35" },
  { id: "1936-1959", from: 1936, to: 1959, label: "1936–59" },
  { id: "1960-1977", from: 1960, to: 1977, label: "1960–77" },
  { id: "1978-1987", from: 1978, to: 1987, label: "1978–87" },
  { id: "1988-2007", from: 1988, to: 2007, label: "1988–07" },
  { id: "2008-2012", from: 2008, to: 2012, label: "2008–12" },
  { id: "2013-2026", from: 2013, to: 2026, label: "2013–26" },
] as const;

export function dashFor(mechanism: Mechanism): string | undefined {
  if (mechanism === "sip_formation") return "6 4";
  if (mechanism === "banking_business_transfer") return "2 3";
  if (mechanism === "rebrand") return "1 4";
  if (mechanism === "minority_equity_investment") return "2 6";
  if (mechanism === "failed_acquisition_attempt") return "8 3 2 3";
  if (mechanism === "asset_transfer") return "1 2";
  if (mechanism === "divestment") return "4 3";
  if (mechanism === "intervention") return "3 2 1 2";
  return undefined;
}

export function isOverlayMechanism(mechanism: Mechanism, layer: GraphLayer): boolean {
  if (layer === "business") return MECHANISM_LINEAGE[mechanism];
  if (layer === "ownership") {
    return (
      mechanism === "minority_equity_investment" ||
      mechanism === "failed_acquisition_attempt" ||
      mechanism === "acquisition" ||
      mechanism === "divestment"
    );
  }
  if (layer === "asset") return mechanism === "asset_transfer";
  return false;
}
