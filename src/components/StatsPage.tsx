import type { SourceRecord, StatPoint } from "../lib/types";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

interface Props {
  points: StatPoint[];
  sources: SourceRecord[];
}

function formatValue(point: StatPoint) {
  if (point.unit === "EUR bn") return `${point.value.toLocaleString("en-GB", { minimumFractionDigits: 3 })}`;
  if (point.unit === "%") return `${point.value}`;
  if (point.unit === "% voting rights") return `${point.value}`;
  return point.value.toLocaleString("en-GB");
}

function Inner({ points, sources }: Props) {
  const { t, locale } = useLocale();
  const bySeries = (series: string) => points.filter((point) => point.series === series);
  const sourceTitle = (id: string) => {
    const found = sources.find((item) => item.id === id);
    if (!found) return id;
    return locale === "es" ? found.title_es : found.title;
  };

  const blocks = [
    { id: "cajas", title: locale === "es" ? "Cajas" : "Savings banks", series: "cajas" },
    { id: "branches", title: locale === "es" ? "Oficinas" : "Branches", series: "branches" },
    { id: "employment", title: locale === "es" ? "Empleo" : "Employment", series: "employment" },
    { id: "frob", title: "FROB", series: "frob" },
    { id: "frob_institution", title: locale === "es" ? "Ayudas por entidad" : "Assistance by institution", series: "frob_institution" },
    { id: "headline", title: locale === "es" ? "Cifras de titular" : "Headline figures", series: "headline" },
    { id: "condition", title: locale === "es" ? "Condición actual (T2 2026)" : "Current condition (Q2 2026)", series: "condition" },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader current="stats" />
      <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navStats}</p>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">{t.statsTitle}</h1>
        <p className="mt-4 text-sm text-muted">{t.statsLead}</p>
        <p className="mt-3 text-xs text-muted">{t.statsSeriesNote}</p>
        <p className="mt-2 text-xs text-muted">{t.statsFrobNote}</p>

        {blocks.map((block) => (
          <section key={block.id} className="mt-10">
            <h2 className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">{block.title}</h2>
            <ul className="mt-4 space-y-3">
              {bySeries(block.series).map((point) => (
                <li key={point.id} className="rounded-xl border border-line bg-panel px-5 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm text-fog">{locale === "es" ? point.label_es : point.label}</p>
                    <p className="shrink-0 font-mono text-lg text-white">
                      {formatValue(point)}{" "}
                      <span className="text-xs text-muted">{point.unit}</span>
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-muted">{point.date}</p>
                  <p className="mt-2 text-xs text-muted">
                    {locale === "es" ? point.definition_es : point.definition}
                  </p>
                  <p className="mt-2 text-xs text-accent">{sourceTitle(point.src)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

export default function StatsPage(props: Props) {
  return (
    <LocaleProvider>
      <Inner {...props} />
    </LocaleProvider>
  );
}
