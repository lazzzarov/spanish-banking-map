import { MAX_YEAR, MIN_YEAR } from "./bankGraph";

export interface Decade {
  from: number;
  to: number;
  label: string;
}

export const DECADES: Decade[] = (() => {
  const list: Decade[] = [];
  for (let from = MIN_YEAR; from <= 2020; from += 10) {
    const to = from === 2020 ? MAX_YEAR : from + 9;
    list.push({ from, to, label: `${from}–${String(to).slice(-2)}` });
  }
  return list;
})();

export function decadeContaining(year: number): Decade {
  return DECADES.find((d) => year >= d.from && year <= d.to) ?? DECADES[0];
}

export function clampToDecade(year: number, decade: Decade): number {
  return Math.min(decade.to, Math.max(decade.from, year));
}

export function prevDecade(decade: Decade): Decade | null {
  const index = DECADES.findIndex((d) => d.from === decade.from);
  return index > 0 ? DECADES[index - 1] : null;
}

export function nextDecade(decade: Decade): Decade | null {
  const index = DECADES.findIndex((d) => d.from === decade.from);
  return index >= 0 && index < DECADES.length - 1 ? DECADES[index + 1] : null;
}
