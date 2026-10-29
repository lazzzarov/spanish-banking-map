import { useState } from "react";
import { interpolate } from "../i18n";
import type { SourceRecord, StatPoint } from "../lib/types";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

export interface SeriesInsight {
  why_en: string;
  why_es: string;
  trend_en: string;
  trend_es: string;
  caution_en: string;
  caution_es: string;
}

interface Props {
  points: StatPoint[];
  sources: SourceRecord[];
  seriesMeta?: Record<string, SeriesInsight>;
}

function formatValue(point: StatPoint) {
  if (point.unit === "EUR bn") return point.value.toLocaleString("en-GB", { minimumFractionDigits: 3 });
  if (point.unit === "%" || point.unit === "% voting rights") return `${point.value}`;
  return point.value.toLocaleString("en-GB");
}

function SeriesBars({ points }: { points: StatPoint[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="mt-4 space-y-2">
      {points.map((point) => (
        <div key={point.id}>
          <div className="mb-1 flex justify-between gap-3 text-xs text-muted">
            <span>{point.date}</span>
            <span className="font-mono text-fog">
              {formatValue(point)} {point.unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-panel-2">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${Math.max(6, (point.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Inner({ points, sources, seriesMeta = {} }: Props) {
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const bySeries = (series: string) => points.filter((point) => point.series === series);
  const sourceTitle = (id: string) => {
    const found = sources.find((item) => item.id === id);
    if (!found) return id;
    return locale === "es" ? found.title_es : found.title;
  };

  const cajasFrom = points.find((point) => point.id === "cajas-precrisis");
  const cajasTo = points.find((point) => point.id === "cajas-remaining");
  const branchesFrom = points.find((point) => point.id === "branches-2008");
  const branchesTo = points.find((point) => point.id === "branches-2020");
  const frob = points.find((point) => point.id === "frob-capital-2026");

  const kpis = [
    cajasFrom &&
      cajasTo && {
        id: "cajas",
        label: locale === "es" ? "Cajas tradicionales" : "Traditional cajas",
        value: `${cajasFrom.value} → ${cajasTo.value}`,
        note: `${cajasFrom.date}–${cajasTo.date}`,
      },
    branchesFrom &&
      branchesTo && {
        id: "branches",
        label: locale === "es" ? "Oficinas (BdE)" : "Branches (BdE)",
        value: `${branchesFrom.value.toLocaleString("en-GB")} → ${branchesTo.value.toLocaleString("en-GB")}`,
        note: `${branchesFrom.date}–${branchesTo.date}`,
      },
    frob && {
      id: "frob",
      label: locale === "es" ? "Asistencia FROB" : "FROB assistance",
      value: `${formatValue(frob)} ${frob.unit}`,
      note: frob.date,
    },
  ].filter(Boolean) as { id: string; label: string; value: string; note: string }[];

  const blocks = [
    { id: "cajas", title: locale === "es" ? "Cajas" : "Savings banks", series: "cajas" },
    { id: "branches", title: locale === "es" ? "Oficinas" : "Branches", series: "branches" },
    { id: "employment", title: locale === "es" ? "Empleo" : "Employment", series: "employment" },
    { id: "frob", title: "FROB", series: "frob" },
    { id: "frob_institution", title: locale === "es" ? "Ayudas por entidad" : "Assistance by institution", series: "frob_institution" },
    { id: "headline", title: locale === "es" ? "Cifras de titular" : "Headline figures", series: "headline" },
    { id: "condition", title: locale === "es" ? "Condición actual (T2 2026)" : "Current condition (Q2 2026)", series: "condition" },
  ].filter((block) => bySeries(block.series).length > 0);

  const current = blocks[Math.min(index, Math.max(blocks.length - 1, 0))];
  const series = current ? bySeries(current.series) : [];
  const numeric = series.length > 1 && series.every((point) => point.unit === series[0]?.unit);

  return (
    <div className="min-h-screen">
      <SiteHeader current="stats" />
      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navStats}</p>
        <h1 className="mt-4 text-3xl text-heading md:text-4xl">{t.statsTitle}</h1>
        <p className="mt-4 max-w-2xl text-sm text-muted">{t.statsLead}</p>
        <p className="mt-3 text-xs text-muted">{t.statsSeriesNote}</p>
        <p className="mt-2 text-xs text-muted">{t.statsFrobNote}</p>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-line bg-panel px-5 py-5">
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{kpi.label}</p>
              <p className="mt-2 text-2xl text-heading">{kpi.value}</p>
              <p className="mt-2 text-xs text-muted">{kpi.note}</p>
            </div>
          ))}
        </section>

        {current && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                className="text-sm text-muted disabled:opacity-40"
              >
                {t.figuresPrev}
              </button>
              <p className="font-mono text-[11px] text-muted">
                {interpolate(t.figuresOf, { current: index + 1, total: blocks.length })}
              </p>
              <button
                type="button"
                disabled={index >= blocks.length - 1}
                onClick={() => setIndex((value) => Math.min(blocks.length - 1, value + 1))}
                className="text-sm text-accent disabled:opacity-40"
              >
                {t.figuresNext}
              </button>
            </div>
            <div key={current.id} className="card-in rounded-2xl border border-line bg-panel px-5 py-5">
              <h2 className="text-xl text-heading">{current.title}</h2>
              {seriesMeta[current.series] && (
                <dl className="mt-4 grid gap-3 rounded-xl border border-line bg-panel-2 px-4 py-4 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] text-accent uppercase">{t.statsInsightWhy}</dt>
                    <dd className="mt-1 text-fog">
                      {locale === "es" ? seriesMeta[current.series].why_es : seriesMeta[current.series].why_en}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-muted uppercase">{t.statsInsightTrend}</dt>
                    <dd className="mt-1 text-xs text-muted">
                      {locale === "es" ? seriesMeta[current.series].trend_es : seriesMeta[current.series].trend_en}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] text-warn uppercase">{t.statsInsightCaution}</dt>
                    <dd className="mt-1 text-xs text-warn">
                      {locale === "es" ? seriesMeta[current.series].caution_es : seriesMeta[current.series].caution_en}
                    </dd>
                  </div>
                </dl>
              )}
              {numeric && <SeriesBars points={series} />}
              <ul className="mt-4 space-y-3">
                {series.map((point) => (
                  <li key={point.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm text-fog">{locale === "es" ? point.label_es : point.label}</p>
                      <p className="shrink-0 font-mono text-base text-heading">
                        {formatValue(point)} <span className="text-xs text-muted">{point.unit}</span>
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {locale === "es" ? point.definition_es : point.definition}
                    </p>
                    <p className="mt-1 text-xs text-accent">{sourceTitle(point.src)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted">{t.statsSeriesNote}</p>
            </div>
          </section>
        )}
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
