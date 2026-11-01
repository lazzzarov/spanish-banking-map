import type { Locale } from "./types";

/** Spanish press writes millions ("542.430 M€"); English writes billions ("€542bn"). */
export function formatEuroBn(value: number, locale: Locale): string {
  if (locale === "es") return `${new Intl.NumberFormat("es-ES").format(Math.round(value * 1000))} M€`;
  const digits = value >= 100 ? 0 : 1;
  return `€${new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value)}bn`;
}
