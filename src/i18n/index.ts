import { en } from "./en";
import { es } from "./es";
import type { Locale } from "../lib/types";

export type Messages = typeof en;
export const messages: Record<Locale, Messages> = { en, es };

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
