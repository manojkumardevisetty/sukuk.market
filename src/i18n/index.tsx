import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_LOCALE, getLocale, isKnownLocale, LOCALES, type LocaleEntry } from "./locales";
import type { Lang } from "./translations";

type I18nValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  /** False until the visitor has explicitly picked (and saved) a language. */
  hasChosenLang: boolean;
  t: (key: string) => string;
  locale: string;
};

const STORAGE_KEY = "sukuk-market-lang";

const I18nContext = createContext<I18nValue | null>(null);

const fallback = getLocale(DEFAULT_LOCALE);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LOCALE);
  const [hasChosenLang, setHasChosenLang] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isKnownLocale(stored)) {
      setLangState(stored as Lang);
      return;
    }
    // First visit: preselect the browser language but ask the visitor to confirm.
    const browser = window.navigator.language?.split("-")[0];
    if (isKnownLocale(browser)) setLangState(browser as Lang);
    setHasChosenLang(false);
  }, []);

  const entry: LocaleEntry = getLocale(lang);

  useEffect(() => {
    document.documentElement.lang = entry.code;
    document.documentElement.dir = entry.dir;
  }, [entry.code, entry.dir]);

  const value = useMemo<I18nValue>(
    () => ({
      lang: entry.code,
      dir: entry.dir,
      locale: entry.intl,
      hasChosenLang,
      setLang: (next) => {
        setLangState(next);
        setHasChosenLang(true);
        window.localStorage.setItem(STORAGE_KEY, next);
      },
      t: (key) => entry.dict[key] ?? fallback.dict[key] ?? key,
    }),
    [entry, hasChosenLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export { LOCALES, DEFAULT_LOCALE, getLocale };
export type { Lang };
