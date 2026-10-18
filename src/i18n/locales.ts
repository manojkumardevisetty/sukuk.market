import { ar, en, ms, type Dict } from "./translations";
import { extraAr, extraEn, extraMs } from "./extra";

/**
 * Locale registry. Adding a language is a data change: append an entry here
 * (and a dictionary in ./translations) — no component or route needs editing.
 * Instrument / issuer names and descriptions are translated in the database
 * (public.content_translations) keyed by the same `code`.
 */
export type LocaleDef = {
  code: string;
  /** Native label shown in the switcher */
  label: string;
  /** English label, used for admin/reference surfaces */
  englishLabel: string;
  dir: "ltr" | "rtl";
  /** BCP-47 tag used for Intl number/date formatting */
  intl: string;
};

export type LocaleEntry = LocaleDef & { dict: Dict };

export const DEFAULT_LOCALE = "en";

export const LOCALES: LocaleEntry[] = [
  { code: "en", label: "English", englishLabel: "English", dir: "ltr", intl: "en-AE", dict: { ...en, ...extraEn } },
  { code: "ar", label: "العربية", englishLabel: "Arabic", dir: "rtl", intl: "ar-AE", dict: { ...ar, ...extraAr } },
  { code: "ms", label: "Bahasa Melayu", englishLabel: "Malay", dir: "ltr", intl: "ms-MY", dict: { ...ms, ...extraMs } },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function getLocale(code: string | null | undefined): LocaleEntry {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]!;
}

export function isKnownLocale(code: string | null | undefined): boolean {
  return !!code && LOCALES.some((l) => l.code === code);
}
