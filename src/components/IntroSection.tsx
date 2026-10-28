import { interpolate } from "../i18n";
import { useLocale } from "./LocaleContext";

interface Props {
  entityCount: number;
  onContinue: () => void;
}

export function IntroSection({ entityCount, onContinue }: Props) {
  const { t } = useLocale();
  return (
    <section className="explorer-section flex flex-col items-center justify-center px-5 py-16 text-center md:px-8">
      <p className="intro-rise font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.heroKicker}</p>
      <h1 className="intro-rise-delay mt-6 max-w-3xl text-4xl text-heading md:text-5xl lg:text-6xl">{t.heroTitle}</h1>
      <p className="intro-rise-delay mt-6 max-w-xl text-base text-muted md:text-lg">
        {interpolate(t.heroLead, { count: entityCount })}
      </p>
      <p className="intro-rise-delay mt-4 max-w-lg text-sm text-muted">{t.scopeCaveat}</p>
      <button
        type="button"
        onClick={onContinue}
        className="intro-rise-delay mt-10 rounded-full border border-accent bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        {t.introNext}
      </button>
      <p className="intro-rise-delay mt-4 text-xs text-muted">{t.introScroll}</p>
    </section>
  );
}
