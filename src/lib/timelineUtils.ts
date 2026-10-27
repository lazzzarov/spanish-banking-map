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
