import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/market", key: "nav.market" },
  { to: "/compare", key: "nav.compare" },
  { to: "/learn", key: "nav.learn" },
  { to: "/about", key: "nav.about" },
] as const;

export function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground font-display text-base font-bold">
            ص
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold leading-tight">{t("brand.name")}</span>
            <span className="block truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("brand.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <UserMenu />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      ) : null}
    </header>
  );
}
