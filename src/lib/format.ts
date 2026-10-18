import type { InstrumentRow } from "./catalogue.server";
import type { Lang } from "@/i18n/translations";

type Translatable = {
  name: string;
  description?: string | null;
  translations?: Record<string, { name: string | null; description: string | null }> | undefined;
};

/** Locale-agnostic: reads the database translation for the active locale, falls back to English. */
export function localizedName(row: Translatable, lang: Lang) {
  return row.translations?.[lang]?.name || row.name;
}

export function localizedDescription(row: Translatable, lang: Lang) {
  return row.translations?.[lang]?.description || row.description || null;
}

/**
 * Compact money is scaled manually (not via Intl `notation: "compact"`) because
 * ICU compact rounding differs between the server and browser runtimes, which
 * produced SSR hydration mismatches ($700M vs $700.00M).
 */
export function formatMoney(amount: number | null | undefined, currency: string, locale: string) {
  if (amount == null) return "—";
  const abs = Math.abs(amount);
  const units: { limit: number; suffix: string }[] = [
    { limit: 1_000_000_000_000, suffix: "T" },
    { limit: 1_000_000_000, suffix: "B" },
    { limit: 1_000_000, suffix: "M" },
  ];
  const unit = units.find((u) => abs >= u.limit);
  if (!unit) {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  }
  const scaled = amount / unit.limit;
  const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
  const rounded = Number(scaled.toFixed(digits));
  const body = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(rounded);
  return `${body}${unit.suffix}`;
}

export function formatNumber(value: number | null | undefined, locale: string, digits = 2) {
  if (value == null) return "—";
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number | null | undefined, locale: string) {
  if (value == null) return "—";
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value)}%`;
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function tenorYears(issue: string | null, maturity: string | null) {
  if (!issue || !maturity) return null;
  const ms = new Date(maturity).getTime() - new Date(issue).getTime();
  return Math.round((ms / (365.25 * 24 * 3600 * 1000)) * 10) / 10;
}

export function ratingLabel(row: InstrumentRow) {
  return [row.rating_moodys, row.rating_sp, row.rating_fitch].filter(Boolean).join(" / ") || "—";
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean))) as T[];
}

export function issuerTypeLabel(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
