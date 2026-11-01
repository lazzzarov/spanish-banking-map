import type { ReactNode } from "react";
import { interpolate } from "../i18n";
import { explorerHref } from "../lib/deepLinks";
import type { Locale, SourceRecord, StatPoint } from "../lib/types";
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

/** Acceptance BBVA's 2025 offer was conditioned on (see the "stillBid" copy and source bbva2025). */
const BBVA_MIN_ACCEPTANCE = 30;

/** Short bank names for the FROB bars; the data labels describe the instrument category. */
const FROB_BANK_NAMES: Record<string, string> = {
  "frob-bankia": "BFA/Bankia",
  "frob-catalunya": "Catalunya Banc",
  "frob-ncg": "NCG Banco",
  "frob-valencia": "Banco de Valencia",
};

const HATCH = "repeating-linear-gradient(135deg, var(--accent) 0 5px, transparent 5px 10px)";

function formatters(locale: Locale) {
  const tag = locale === "es" ? "es-ES" : "en-GB";
  const number = new Intl.NumberFormat(tag);
  const decimal = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 });
  const change = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 0, signDisplay: "always" });
  const share = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 1 });
  const oneDecimal = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  return {
    number: (value: number) => number.format(value),
    decimal: (value: number) => decimal.format(value),
    change: (from: number, to: number) => change.format((to - from) / from).replace("-", "−"),
    share: (part: number, whole: number) => share.format(part / whole),
    // Spanish press writes millions ("56.545 M€"); English writes billions ("€56.5bn").
    euroBn: (value: number) =>
      locale === "es" ? `${number.format(Math.round(value * 1000))} M€` : `€${oneDecimal.format(value)}bn`,
    percent: (value: number) => `${decimal.format(value)}${locale === "es" ? " %" : "%"}`,
  };
}

function Card({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-6 rounded-2xl border border-line bg-panel p-6 md:p-8 ${className}`}>
      {children}
    </section>
  );
}

function Inner({ points, sources, seriesMeta = {} }: Props) {
  const { t, locale } = useLocale();
  const f = formatters(locale);
  const point = (id: string) => points.find((item) => item.id === id);
  const series = (name: string) => points.filter((item) => item.series === name);
  const caution = (name: string) => {
    const meta = seriesMeta[name];
    return meta ? (locale === "es" ? meta.caution_es : meta.caution_en) : null;
  };

  // Footnotes are numbered in the order the page cites them.
  const citeOrder: string[] = [];
  const cite = (src: string | undefined) => {
    if (!src) return null;
    if (!citeOrder.includes(src)) citeOrder.push(src);
    const n = citeOrder.indexOf(src) + 1;
    return (
      <sup key={src}>
        <a href={`#src-${n}`} className="text-accent">
          {n}
        </a>
      </sup>
    );
  };

  const cajasFrom = point("cajas-precrisis");
  const cajasTo = point("cajas-remaining");
  const branches = series("branches");
  const jobs = series("employment");
  const frobGranted = point("frob-capital-2026");
  const frobRecovered = point("frob-recovered-2026");
  const frobByBank = series("frob_institution").sort((a, b) => b.value - a.value);
  const popular = point("popular-price");
  const bbva = point("bbva-acceptance");
  const bpce = point("bpce-stake");
  const today = series("condition");

  const label = (item: StatPoint) => (locale === "es" ? item.label_es : item.label);
  const yearOf = (item: StatPoint) => Number(item.date.slice(0, 4));

  const columnChart = (rows: StatPoint[]) => {
    const max = Math.max(...rows.map((row) => row.value), 1);
    const mainSrc = rows[0]?.src;
    return (
      <div>
        <div className="mt-6 flex h-56 items-end gap-4 border-b border-line">
          {rows.map((row) => (
            <div key={row.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-xs text-heading">{f.number(row.value)}</span>
              <div
                className="w-full max-w-[72px] rounded-t-md"
                title={label(row)}
                style={{
                  height: `${Math.round((row.value / max) * 170)}px`,
                  background: row.src === mainSrc ? "var(--accent)" : HATCH,
                  boxShadow: row.src === mainSrc ? undefined : "inset 0 0 0 1.5px var(--accent)",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4">
          {rows.map((row) => (
            <span key={row.id} className="flex-1 text-center font-mono text-xs text-muted">
              {row.date.slice(0, 4)}
              {cite(row.src)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Headline change uses only points from the series' first source, so it never mixes compilers.
  const changeTitle = (template: string, rows: StatPoint[]) => {
    const first = rows[0];
    const sameSource = rows.filter((row) => row.src === first?.src);
    const last = sameSource[sameSource.length - 1];
    if (!first || !last || last === first) return "";
    return interpolate(template, {
      change: f.change(first.value, last.value),
      from: yearOf(first),
      to: yearOf(last),
    });
  };

  const turning = [
    popular && {
      id: popular.id,
      date: popular.date,
      title: t.figPopularTitle,
      body: t.figPopularBody,
      map: t.figPopularMap,
      href: explorerHref({ entity: "banco-popular", year: yearOf(popular) }),
      stat: "1 €",
      statNote: t.figPopularStat,
      bar: null,
      src: popular.src,
    },
    bbva && {
      id: bbva.id,
      date: bbva.date,
      title: t.figBbvaTitle,
      body: interpolate(t.figBbvaBody, { min: BBVA_MIN_ACCEPTANCE, value: f.decimal(bbva.value) }),
      map: t.figBbvaMap,
      href: explorerHref({ entity: "sabadell", year: yearOf(bbva) }),
      stat: f.percent(bbva.value),
      statNote: interpolate(t.figBbvaStat, { min: BBVA_MIN_ACCEPTANCE }),
      bar: { value: bbva.value, marker: BBVA_MIN_ACCEPTANCE, color: "var(--deal)" },
      src: bbva.src,
    },
    bpce && {
      id: bpce.id,
      date: bpce.date,
      title: interpolate(t.figBpceTitle, { value: f.decimal(bpce.value) }),
      body: t.figBpceBody,
      map: t.figBpceMap,
      href: explorerHref({ entity: "sabadell", year: yearOf(bpce) }),
      stat: f.percent(bpce.value),
      statNote: t.figBpceStat,
      bar: { value: bpce.value, marker: null, color: "var(--accent)" },
      src: bpce.src,
    },
  ].filter(Boolean) as {
    id: string;
    date: string;
    title: string;
    body: string;
    map: string;
    href: string;
    stat: string;
    statNote: string;
    bar: { value: number; marker: number | null; color: string } | null;
    src: string;
  }[];

  const todayLabel: Record<string, string> = {
    "cet1-2026q2": t.figTodayCet1,
    "npl-2026q2": t.figTodayNpl,
    "roe-2026q2": t.figTodayRoe,
  };

  const longDate = (iso: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { day: "numeric", month: "long" }).format(
      new Date(`${iso}T12:00:00Z`),
    );
  };

  const chapters = [
    { href: "#cajas", title: t.figCh1, question: t.figCh1Q },
    { href: "#branches", title: t.figCh2, question: t.figCh2Q },
    { href: "#jobs", title: t.figCh3, question: t.figCh3Q },
    { href: "#frob", title: t.figCh4, question: t.figCh4Q },
    { href: "#turning", title: t.figCh5, question: t.figCh5Q },
    { href: "#today", title: t.figCh6, question: t.figCh6Q },
  ];

  const kicker = (n: number, dark = false) => (
    <p className={`font-mono text-xs tracking-[0.12em] uppercase ${dark ? "opacity-75" : "text-accent"}`}>
      {interpolate(t.figChapter, { n })}
    </p>
  );

  // Each chapter says why its number was chosen, from the series notes in the data.
  const whyLine = (series: string, dark = false) => {
    const meta = seriesMeta[series];
    if (!meta) return null;
    return (
      <p
        className={`mt-3 flex flex-wrap gap-x-2.5 gap-y-1 rounded-lg px-3.5 py-3 text-sm leading-relaxed ${
          dark ? "bg-panel/10" : "bg-accent/10"
        }`}
      >
        <strong className={dark ? "" : "text-accent"}>{t.figWhyThis}</strong>
        <span className={dark ? "opacity-90" : "text-fog"}>{locale === "es" ? meta.why_es : meta.why_en}</span>
      </p>
    );
  };

  const bridge = (text: string) => (
    <p className="mx-auto max-w-2xl text-center text-[15px] leading-relaxed text-muted italic">{text}</p>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader current="stats" />
      <main className="mx-auto flex max-w-5xl flex-col gap-7 px-5 py-10 md:px-8">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navStats}</p>
          <h1 className="mt-3 text-3xl leading-tight font-bold text-heading md:text-4xl">{t.figTitle}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{t.figLead}</p>
        </div>

        <section className="flex flex-wrap gap-7 rounded-2xl border border-line bg-panel p-6 md:p-8">
          <div className="min-w-0 flex-[1_1_360px]">
            <h2 className="text-lg font-bold text-heading">{t.figWhyTitle}</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-fog">{t.figWhyBody}</p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{t.figWhyNote}</p>
          </div>
          <nav aria-label={t.navStats} className="min-w-0 flex-[1_1_280px]">
            <ol className="flex flex-col gap-0.5">
              {chapters.map((chapter, index) => (
                <li key={chapter.href}>
                  <a href={chapter.href} className="flex items-baseline gap-3.5 rounded-lg px-2.5 py-2 hover:bg-panel-2">
                    <span className="min-w-5 font-mono text-xl text-accent">{index + 1}</span>
                    <span>
                      <span className="block text-sm font-semibold text-heading">{chapter.title}</span>
                      <span className="block text-xs text-muted">{chapter.question}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        {cajasFrom && cajasTo && (
          <Card id="cajas" className="flex flex-wrap items-center gap-8">
            <div className="min-w-0 flex-[1_1_300px]">
              {kicker(1)}
              <h2 className="mt-1.5 text-xl font-bold text-heading md:text-2xl">
                {interpolate(t.figCajasTitle, { from: cajasFrom.value, to: cajasTo.value })}
              </h2>
              {whyLine("cajas")}
              <p className="mt-3 text-[15px] leading-relaxed text-fog">
                {interpolate(t.figCajasBody, { from: cajasFrom.value, to: cajasTo.value })}
              </p>
              <p className="mt-5 font-mono text-5xl leading-none text-heading">
                {cajasFrom.value} <span className="text-muted">→</span> <span className="text-accent">{cajasTo.value}</span>
              </p>
              <p className="mt-2 text-xs text-muted">
                {cajasFrom.date}–{cajasTo.date} {cite(cajasFrom.src)}
              </p>
              {caution("cajas") && <p className="mt-3 text-xs leading-relaxed text-muted">{caution("cajas")}</p>}
            </div>
            <div
              role="img"
              aria-label={interpolate(t.figCajasDots, { from: cajasFrom.value, to: cajasTo.value })}
              className="grid max-w-[420px] flex-[1_1_320px] grid-cols-9 gap-2.5"
            >
              {Array.from({ length: cajasFrom.value }, (_, index) => (
                <span
                  key={index}
                  className={`block aspect-square rounded-full ${
                    index >= cajasFrom.value - cajasTo.value ? "bg-accent" : "border-2 border-line bg-panel"
                  }`}
                />
              ))}
            </div>
          </Card>
        )}

        {bridge(t.figBridge1)}

        <div className="flex flex-wrap gap-5">
          {branches.length > 1 && (
            <Card id="branches" className="min-w-0 flex-[1_1_400px]">
              {kicker(2)}
              <h2 className="mt-1.5 text-lg font-bold text-heading md:text-xl">{changeTitle(t.figBranchesTitle, branches)}</h2>
              <p className="mt-1 text-sm text-muted">{t.figBranchesSub}</p>
              {whyLine("branches")}
              {columnChart(branches)}
              <p className="mt-4 text-xs leading-relaxed text-muted">{caution("branches") ?? t.figOtherSource}</p>
            </Card>
          )}
          {jobs.length > 1 && (
            <Card id="jobs" className="min-w-0 flex-[1_1_400px]">
              {kicker(3)}
              <h2 className="mt-1.5 text-lg font-bold text-heading md:text-xl">{changeTitle(t.figJobsTitle, jobs)}</h2>
              <p className="mt-1 text-sm text-muted">{t.figJobsSub}</p>
              {whyLine("employment")}
              {columnChart(jobs)}
              <p className="mt-4 text-xs leading-relaxed text-muted">{caution("employment") ?? t.figOtherSource}</p>
            </Card>
          )}
          <p className="w-full text-xs text-muted">{t.figOtherSource}</p>
        </div>

        {bridge(t.figBridge2)}

        {frobGranted && frobRecovered && (
          <Card id="frob" className="flex flex-col gap-6">
            <div>
              {kicker(4)}
              <h2 className="mt-1.5 text-xl font-bold text-heading md:text-2xl">
                {interpolate(t.figFrobTitle, {
                  granted: f.euroBn(frobGranted.value),
                  recovered: f.euroBn(frobRecovered.value),
                })}
              </h2>
              {whyLine("frob")}
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                {t.statsFrobNote} {cite(frobGranted.src)}
              </p>
            </div>
            <div>
              <div className="flex h-9 overflow-hidden rounded-lg bg-panel-2">
                <div className="bg-accent" style={{ width: `${(frobRecovered.value / frobGranted.value) * 100}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[13px]">
                <span>
                  <span className="font-semibold text-accent">{t.figFrobRecovered}</span>
                  <span className="text-fog">
                    {" "}
                    · {f.euroBn(frobRecovered.value)} ({f.share(frobRecovered.value, frobGranted.value)})
                  </span>
                </span>
                <span className="text-muted">
                  {t.figFrobGranted} · {f.euroBn(frobGranted.value)}
                </span>
              </div>
            </div>
            {frobByBank.length > 0 && (
              <div>
                <p className="mb-3 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                  {t.figFrobByBank} {cite(frobByBank[0].src)}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {frobByBank.map((row) => (
                    <li key={row.id} className="flex items-center gap-3.5">
                      <span className="w-40 shrink-0 text-sm text-fog">{FROB_BANK_NAMES[row.id] ?? label(row)}</span>
                      <span className="h-5 flex-1 overflow-hidden rounded-md bg-panel-2">
                        <span
                          className="block h-full rounded-md bg-[var(--deal)]"
                          style={{ width: `${(row.value / frobByBank[0].value) * 100}%` }}
                        />
                      </span>
                      <span className="w-20 shrink-0 text-right font-mono text-[13px] text-heading">
                        {f.euroBn(row.value)}
                      </span>
                    </li>
                  ))}
                </ul>
                {caution("frob_institution") && (
                  <p className="mt-3 text-xs text-muted">{caution("frob_institution")}</p>
                )}
              </div>
            )}
          </Card>
        )}

        {bridge(t.figBridge3)}

        {turning.length > 0 && (
          <Card id="turning">
            {kicker(5)}
            <h2 className="mt-1.5 text-xl font-bold text-heading md:text-2xl">{t.figTurningTitle}</h2>
            {whyLine("headline")}
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t.figTurningLead}</p>
            <div className="mt-4">
              {turning.map((item) => (
                <article key={item.id} className="flex flex-wrap gap-6 border-t border-line py-5 last:pb-0">
                  <div className="w-28 shrink-0">
                    <p className="font-mono text-2xl text-heading">{item.date.slice(0, 4)}</p>
                    <p className="mt-0.5 text-xs text-muted">{longDate(item.date)}</p>
                  </div>
                  <div className="min-w-0 flex-[1_1_360px]">
                    <h3 className="text-[17px] font-bold text-heading">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fog">{item.body}</p>
                    <p className="mt-2 text-[13px] text-muted">
                      <strong className="text-heading">{t.figTurnOnMap}</strong> {item.map}{" "}
                      <a href={item.href} className="font-semibold text-accent hover:underline">
                        {interpolate(t.figSeeOnMap, { year: item.date.slice(0, 4) })}
                      </a>
                    </p>
                  </div>
                  <div className="flex-[0_1_220px] self-start rounded-xl bg-panel-2 px-4 py-3.5">
                    <p className="font-mono text-2xl text-heading">{item.stat}</p>
                    {item.bar && (
                      <div className="relative mt-2.5 h-2 rounded bg-line" role="presentation">
                        <div className="h-2 rounded" style={{ width: `${item.bar.value}%`, background: item.bar.color }} />
                        {item.bar.marker != null && (
                          <div className="absolute -top-1 h-4 w-0.5 bg-heading" style={{ left: `${item.bar.marker}%` }} />
                        )}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs leading-snug text-muted">
                      {item.statNote} {cite(item.src)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        )}

        {bridge(t.figBridge4)}

        {today.length > 0 && (
          <section id="today" className="scroll-mt-6 rounded-2xl bg-heading p-6 text-panel md:p-8">
            {kicker(6, true)}
            <h2 className="mt-1.5 text-xl font-bold md:text-2xl">{t.figTodayTitle}</h2>
            {whyLine("condition", true)}
            <p className="mt-1 text-sm opacity-75">
              {interpolate(t.figTodaySub, { date: today[0].date.replace("-", " ") })} {cite(today[0].src)}
            </p>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
              {today.map((item) => (
                <div key={item.id}>
                  <p className="font-mono text-4xl">{f.percent(item.value)}</p>
                  <p className="mt-1.5 text-sm opacity-80">{todayLabel[item.id] ?? label(item)}</p>
                </div>
              ))}
            </div>
            {caution("condition") && <p className="mt-4 text-xs opacity-70">{caution("condition")}</p>}
          </section>
        )}

        <footer className="border-t border-line pt-5">
          <p className="mb-2 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{t.sources}</p>
          <ol className="list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-fog">
            {citeOrder.map((src, index) => {
              const source = sources.find((item) => item.id === src);
              const title = source ? (locale === "es" ? source.title_es : source.title) : src;
              return (
                <li key={src} id={`src-${index + 1}`} className="scroll-mt-6">
                  {source?.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted">{t.statsSeriesNote}</p>
        </footer>
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
