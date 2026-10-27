import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type Messages } from "../i18n";
import type { Locale } from "../lib/types";

export type Theme = "light" | "dark";

interface LocaleState {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const LocaleContext = createContext<LocaleState | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const lang = new URLSearchParams(window.location.search).get("lang");
  if (lang === "en" || lang === "es") return lang;
  const stored = window.localStorage.getItem("locale");
  if (stored === "en" || stored === "es") return stored;
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function detectTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem("theme") === "dark" ? "dark" : "light";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setLocaleState(detectLocale());
    setThemeState(detectTheme());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("locale", next);
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem("theme", next);
  };

  const value = useMemo(
    () => ({ locale, t: messages[locale], setLocale, theme, setTheme }),
    [locale, theme],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
