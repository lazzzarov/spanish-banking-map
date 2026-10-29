import { interpolate, type Messages } from "../i18n";
import { MECHANISM_LINEAGE, type BankDataset, type Event, type Mechanism } from "./types";

const FATE_MECHANISMS = [
  "absorption",
  "merger",
  "banking_business_transfer",
  "acquisition",
  "sip_formation",
  "resolution",
  "resolution_sale",
  "rebrand",
  "intervention",
  "divestment",
] as const satisfies readonly Mechanism[];

type FateMechanism = (typeof FATE_MECHANISMS)[number];

function isFateMechanism(mechanism: Mechanism): mechanism is FateMechanism {
  return (FATE_MECHANISMS as readonly Mechanism[]).includes(mechanism);
}

/** Plain-language line for an event, e.g. "Bankia absorbed by CaixaBank". */
export function eventSentence(t: Messages, event: Event, label: (id: string) => string): string {
  return interpolate(t[`phrase_${event.mechanism}`], { from: label(event.from), to: label(event.to) });
}

/**
 * The completed lineage event that ended an institution's own banking story,
 * so the panel can say "Absorbed by CaixaBank in 2021" instead of a bare status.
 */
export function fateEvent(dataset: BankDataset, entityId: string): Event | null {
  const outgoing = dataset.events
    .filter(
      (event) =>
        event.from === entityId &&
        event.outcome === "completed" &&
        MECHANISM_LINEAGE[event.mechanism] &&
        isFateMechanism(event.mechanism),
    )
    .sort((a, b) => b.year - a.year);
  return outgoing[0] ?? null;
}

export function fateSentence(t: Messages, event: Event, label: (id: string) => string): string | null {
  if (!isFateMechanism(event.mechanism)) return null;
  return interpolate(t[`fate_${event.mechanism}`], { to: label(event.to), year: event.year });
}
