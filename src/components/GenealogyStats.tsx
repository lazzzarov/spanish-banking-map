import { genealogyStats } from "../lib/bankGraph";
import type { BankDataset } from "../lib/types";
import { useLocale } from "./LocaleContext";

const GROUP_LABEL: Record<string, string> = {
  caixabank: "CaixaBank",
  santander: "Santander",
  bbva: "BBVA",
  sabadell: "Sabadell",
  unicaja: "Unicaja",
  ibercaja: "Ibercaja",
  kutxabank: "Kutxabank",
  abanca: "Abanca",
};

export function GenealogyStats({ dataset, year }: { dataset: BankDataset; year: number }) {
  const { t } = useLocale();
  const stats = genealogyStats(dataset, year);
  const items = [
    { label: t.statsIndependent, value: String(stats.independent) },
    { label: t.statsEvents, value: String(stats.consolidations) },
    {
      label: t.statsLargest,
      value: stats.largestFamily.id
        ? `${GROUP_LABEL[stats.largestFamily.id] ?? stats.largestFamily.id} · ${stats.largestFamily.count}`
        : t.none,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-panel px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{item.label}</p>
          <p className="mt-1 text-lg text-fog">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
