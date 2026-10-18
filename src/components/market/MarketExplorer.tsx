import { Link } from "@tanstack/react-router";
import { Download, Leaf, Star } from "lucide-react";
import { useMemo } from "react";

import { useI18n } from "@/i18n";
import type { InstrumentRow } from "@/lib/catalogue.server";
import {
  formatDate,
  formatMoney,
  formatPercent,
  issuerTypeLabel,
  localizedName,
  ratingLabel,
  unique,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type MarketSearch = {
  q: string;
  country: string;
  issuerType: string;
  structure: string;
  currency: string;
  status: string;
  rating: string;
  maturity: string;
  yieldMin: string;
  yieldMax: string;
  esg: boolean;
  aaoifi: boolean;
  tokenized: boolean;
  sort: string;
};

export const defaultSearch: MarketSearch = {
  q: "",
  country: "all",
  issuerType: "all",
  structure: "all",
  currency: "all",
  status: "all",
  rating: "all",
  maturity: "all",
  yieldMin: "",
  yieldMax: "",
  esg: false,
  aaoifi: false,
  tokenized: false,
  sort: "yield",
};

const RATING_BANDS: Record<string, string[]> = {
  aaa_aa: ["AAA", "AA", "Aaa", "Aa"],
  a: ["A"],
  bbb: ["BBB", "Baa"],
  hy: ["BB", "B", "CCC", "Ba", "Caa"],
};

function ratingBand(row: InstrumentRow): string | null {
  const codes = [row.rating_moodys, row.rating_sp, row.rating_fitch].filter(Boolean) as string[];
  if (codes.length === 0) return null;
  for (const [band, prefixes] of Object.entries(RATING_BANDS)) {
    if (codes.some((c) => prefixes.some((p) => c.toUpperCase().startsWith(p.toUpperCase())))) return band;
  }
  return null;
}

function yearsToMaturity(row: InstrumentRow): number | null {
  if (!row.maturity_date) return null;
  return (new Date(row.maturity_date).getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000);
}

function matchesMaturity(row: InstrumentRow, bucket: string) {
  const y = yearsToMaturity(row);
  if (bucket === "veryLong") return y == null || y >= 15;
  if (y == null) return false;
  if (bucket === "short") return y < 3;
  if (bucket === "medium") return y >= 3 && y < 7;
  if (bucket === "long") return y >= 7 && y < 15;
  return true;
}

export function filterInstruments(rows: InstrumentRow[], s: MarketSearch) {
  const q = s.q.trim().toLowerCase();
  const min = s.yieldMin === "" ? null : Number(s.yieldMin);
  const max = s.yieldMax === "" ? null : Number(s.yieldMax);

  const filtered = rows.filter((row) => {
    if (q) {
      const hay = `${row.name} ${row.issuer.name} ${row.isin ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (s.country !== "all" && row.issuer.country !== s.country) return false;
    if (s.issuerType !== "all" && row.issuer.issuer_type !== s.issuerType) return false;
    if (s.structure !== "all" && row.structure !== s.structure) return false;
    if (s.currency !== "all" && row.currency !== s.currency) return false;
    if (s.status !== "all" && row.status !== s.status) return false;
    if (s.rating !== "all" && ratingBand(row) !== s.rating) return false;
    if (s.maturity !== "all" && !matchesMaturity(row, s.maturity)) return false;
    if (min != null && !Number.isNaN(min) && (row.yield_to_maturity ?? -Infinity) < min) return false;
    if (max != null && !Number.isNaN(max) && (row.yield_to_maturity ?? Infinity) > max) return false;
    if (s.esg && !row.is_esg) return false;
    if (s.aaoifi && !row.aaoifi_compliant) return false;
    if (s.tokenized && !row.is_tokenized) return false;
    return true;
  });

  const sorted = [...filtered];
  if (s.sort === "yield") sorted.sort((a, b) => (b.yield_to_maturity ?? 0) - (a.yield_to_maturity ?? 0));
  else if (s.sort === "maturity")
    sorted.sort((a, b) => (a.maturity_date ?? "9999").localeCompare(b.maturity_date ?? "9999"));
  else if (s.sort === "size") sorted.sort((a, b) => (b.size_amount ?? 0) - (a.size_amount ?? 0));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

export function StatusBadge({ status }: { status: InstrumentRow["status"] }) {
  const { t } = useI18n();
  const variant =
    status === "open" ? "bg-primary text-primary-foreground" : status === "matured" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${variant}`}>{t(`status.${status}`)}</span>;
}

function toCsv(rows: InstrumentRow[]) {
  const header = [
    "name",
    "issuer",
    "country",
    "structure",
    "isin",
    "currency",
    "size",
    "profit_rate",
    "yield_to_maturity",
    "maturity_date",
    "rating",
    "status",
  ];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.name,
      r.issuer.name,
      r.issuer.country,
      r.structure,
      r.isin,
      r.currency,
      r.size_amount,
      r.profit_rate,
      r.yield_to_maturity,
      r.maturity_date,
      ratingLabel(r),
      r.status,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function MarketExplorer({
  rows,
  search,
  onChange,
  actions,
}: {
  rows: InstrumentRow[];
  search: MarketSearch;
  onChange: (patch: Partial<MarketSearch>) => void;
  actions?: React.ReactNode;
}) {
  const { t, lang, locale } = useI18n();

  const countries = useMemo(() => unique(rows.map((r) => r.issuer.country)).sort(), [rows]);
  const structures = useMemo(() => unique(rows.map((r) => r.structure ?? "")).sort(), [rows]);
  const currencies = useMemo(() => unique(rows.map((r) => r.currency)).sort(), [rows]);
  const issuerTypes = useMemo(() => unique(rows.map((r) => r.issuer.issuer_type)).sort(), [rows]);
  const results = useMemo(() => filterInstruments(rows, search), [rows, search]);

  function exportCsv() {
    const blob = new Blob([toCsv(results)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sukuk-screen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="text-xs text-muted-foreground">{t("filter.search")}</Label>
            <Input
              value={search.q}
              onChange={(e) => onChange({ q: e.target.value.slice(0, 100) })}
              placeholder={t("filter.search")}
              className="mt-1"
            />
          </div>
          <FilterSelect
            label={t("filter.country")}
            value={search.country}
            onChange={(v) => onChange({ country: v })}
            options={countries.map((c) => ({ value: c, label: c }))}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.issuerType")}
            value={search.issuerType}
            onChange={(v) => onChange({ issuerType: v })}
            options={issuerTypes.map((c) => ({ value: c, label: issuerTypeLabel(c) }))}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.structure")}
            value={search.structure}
            onChange={(v) => onChange({ structure: v })}
            options={structures.map((c) => ({ value: c, label: c }))}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.currency")}
            value={search.currency}
            onChange={(v) => onChange({ currency: v })}
            options={currencies.map((c) => ({ value: c, label: c }))}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.status")}
            value={search.status}
            onChange={(v) => onChange({ status: v })}
            options={["open", "listed", "matured", "upcoming"].map((c) => ({ value: c, label: t(`status.${c}`) }))}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.rating")}
            value={search.rating}
            onChange={(v) => onChange({ rating: v })}
            options={[
              { value: "aaa_aa", label: "AAA / AA" },
              { value: "a", label: "A" },
              { value: "bbb", label: "BBB" },
              { value: "hy", label: "BB and below" },
            ]}
            allLabel={t("filter.all")}
          />
          <FilterSelect
            label={t("filter.maturity")}
            value={search.maturity}
            onChange={(v) => onChange({ maturity: v })}
            options={[
              { value: "short", label: t("maturity.short") },
              { value: "medium", label: t("maturity.medium") },
              { value: "long", label: t("maturity.long") },
              { value: "veryLong", label: t("maturity.veryLong") },
            ]}
            allLabel={t("filter.all")}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">{t("filter.yieldMin")}</Label>
              <Input
                inputMode="decimal"
                value={search.yieldMin}
                onChange={(e) => onChange({ yieldMin: e.target.value.slice(0, 6) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("filter.yieldMax")}</Label>
              <Input
                inputMode="decimal"
                value={search.yieldMax}
                onChange={(e) => onChange({ yieldMax: e.target.value.slice(0, 6) })}
                className="mt-1"
              />
            </div>
          </div>
          <FilterSelect
            label={t("sort.label")}
            value={search.sort}
            onChange={(v) => onChange({ sort: v })}
            options={[
              { value: "yield", label: t("sort.yield") },
              { value: "maturity", label: t("sort.maturity") },
              { value: "size", label: t("sort.size") },
              { value: "name", label: t("sort.name") },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <Toggle id="esg" checked={search.esg} onChange={(v) => onChange({ esg: v })} label={t("filter.esg")} />
            <Toggle
              id="aaoifi"
              checked={search.aaoifi}
              onChange={(v) => onChange({ aaoifi: v })}
              label={t("filter.aaoifi")}
            />
            <Toggle
              id="tokenized"
              checked={search.tokenized}
              onChange={(v) => onChange({ tokenized: v })}
              label={t("filter.tokenized")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tnum text-sm text-muted-foreground">
              {results.length} {t("filter.results")}
            </span>
            {actions}
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              {t("action.exportCsv")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(defaultSearch)}>
              {t("filter.reset")}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-hidden rounded-lg border border-border bg-card lg:block">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("col.name")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("col.country")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("col.structure")}</th>
              <th className="px-4 py-3 text-end font-medium">{t("col.size")}</th>
              <th className="px-4 py-3 text-end font-medium">{t("col.rate")}</th>
              <th className="px-4 py-3 text-end font-medium">{t("col.yield")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("col.maturity")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("col.rating")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("col.status")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.id} className="border-t border-border transition-colors hover:bg-secondary/60">
                <td className="px-4 py-3">
                  <Link to="/instrument/$slug" params={{ slug: row.slug }} className="block">
                    <span className="flex items-center gap-2 font-medium">
                      {localizedName(row, lang)}
                      {row.is_esg ? <Leaf className="h-3.5 w-3.5 text-primary" /> : null}
                      {row.featured ? <Star className="h-3.5 w-3.5 text-gold" /> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">{localizedName(row.issuer, lang)}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.issuer.country}</td>
                <td className="px-4 py-3">{row.structure ?? "—"}</td>
                <td className="tnum px-4 py-3 text-end">{formatMoney(row.size_amount, row.currency, locale)}</td>
                <td className="tnum px-4 py-3 text-end">{formatPercent(row.profit_rate, locale)}</td>
                <td className="tnum px-4 py-3 text-end font-medium">{formatPercent(row.yield_to_maturity, locale)}</td>
                <td className="tnum px-4 py-3">
                  {row.maturity_date ? formatDate(row.maturity_date, locale) : t("detail.perpetual")}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{ratingLabel(row)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 grid gap-3 lg:hidden">
        {results.map((row) => (
          <Link
            key={row.id}
            to="/instrument/$slug"
            params={{ slug: row.slug }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{localizedName(row, lang)}</p>
                <p className="truncate text-xs text-muted-foreground">{localizedName(row.issuer, lang)}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Field label={t("col.yield")} value={formatPercent(row.yield_to_maturity, locale)} />
              <Field label={t("col.maturity")} value={row.maturity_date ? formatDate(row.maturity_date, locale) : t("detail.perpetual")} />
              <Field label={t("col.size")} value={formatMoney(row.size_amount, row.currency, locale)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{row.issuer.country}</Badge>
              {row.structure ? <Badge variant="secondary">{row.structure}</Badge> : null}
              {row.is_esg ? <Badge className="bg-primary text-primary-foreground">{t("detail.esgBadge")}</Badge> : null}
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">{t("filter.results")}: 0</p>
      ) : null}
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="tnum truncate font-medium">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <div className="min-w-0">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel ? <SelectItem value="all">{allLabel}</SelectItem> : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
