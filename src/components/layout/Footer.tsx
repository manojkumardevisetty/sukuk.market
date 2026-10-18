import { Link } from "@tanstack/react-router";

import { useI18n } from "@/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <strong>{t("disclaimer.title")}:</strong> {t("disclaimer")}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-base font-bold">{t("brand.name")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("disclaimer.short")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/market" className="hover:text-foreground">
              {t("nav.market")}
            </Link>
            <Link to="/compare" className="hover:text-foreground">
              {t("nav.compare")}
            </Link>
            <Link to="/learn" className="hover:text-foreground">
              {t("nav.learn")}
            </Link>
            <Link to="/answers" className="hover:text-foreground">
              Answers
            </Link>
            <Link to="/data" className="hover:text-foreground">
              Open data
            </Link>
            <Link to="/about" className="hover:text-foreground">
              {t("nav.about")}
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
