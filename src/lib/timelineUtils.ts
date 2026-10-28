import { eventsInYear, MAX_YEAR, MIN_YEAR } from "./bankGraph";
import type { ContextEvent, Event, GraphLayer } from "./types";

export const YEAR_MARKS = [1921, 1988, 2010, 2017, 2021, 2026] as const;

export function clampYear(year: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(year)));
}

export function nextYear(year: number): number {
  return year >= MAX_YEAR ? MAX_YEAR : year + 1;
}

export function nextPlayableYear(
  events: Event[],
  context: ContextEvent[],
  year: number,
  layer: GraphLayer,
): number {
  for (let next = year + 1; next <= MAX_YEAR; next++) {
    if (eventsInYear(events, next, layer).length > 0) return next;
    if ((layer === "context" || layer === "business") && context.some((item) => item.year === next)) {
      return next;
    }
  }
  return MAX_YEAR;
}

export function nearestPlayableYear(
  events: Event[],
  context: ContextEvent[],
  year: number,
  layer: GraphLayer,
): number {
  const hasHere =
    eventsInYear(events, year, layer).length > 0 ||
    ((layer === "context" || layer === "business") && context.some((item) => item.year === year));
  if (hasHere) return year;
  const forward = nextPlayableYear(events, context, year, layer);
  if (forward !== MAX_YEAR || eventsInYear(events, MAX_YEAR, layer).length > 0) return forward;
  for (let prev = year - 1; prev >= MIN_YEAR; prev--) {
    if (eventsInYear(events, prev, layer).length > 0) return prev;
    if ((layer === "context" || layer === "business") && context.some((item) => item.year === prev)) {
      return prev;
    }
  }
  return year;
}
