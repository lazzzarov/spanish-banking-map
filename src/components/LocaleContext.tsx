import {
  createContext,
  useCallback,
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

/** Storage can throw when site data is blocked; preferences then last for the page view only. */
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Preference stays in memory. */
  }
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const lang = new URLSearchParams(window.location.search).get("lang");
  if (lang === "en" || lang === "es") return lang;
  const stored = readStored("locale");
  if (stored === "en" || stored === "es") return stored;
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function detectTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return readStored("theme") === "dark" ? "dark" : "light";
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

  // Stable identities: consumers list these in effect dependencies.
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStored("locale", next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writeStored("theme", next);
  }, []);

  const value = useMemo(
    () => ({ locale, t: messages[locale], setLocale, theme, setTheme }),
    [locale, theme, setLocale, setTheme],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
