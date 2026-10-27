import { MAX_YEAR, MIN_YEAR } from "./bankGraph";

export const YEAR_MARKS = [1921, 1988, 2010, 2017, 2021, 2026] as const;

export function clampYear(year: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(year)));
}

export function nextYear(year: number): number {
  return year >= MAX_YEAR ? MAX_YEAR : year + 1;
}
