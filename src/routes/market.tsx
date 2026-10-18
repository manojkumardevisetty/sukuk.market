import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { sukukQuery } from "@/lib/queries";
import { saveScreen } from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { MarketExplorer, defaultSearch, type MarketSearch } from "@/components/market/MarketExplorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { abs, breadcrumb, datasetLd, ldScript } from "@/lib/seo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  country: fallback(z.string(), "all").default("all"),
  issuerType: fallback(z.string(), "all").default("all"),
  structure: fallback(z.string(), "all").default("all"),
  currency: fallback(z.string(), "all").default("all"),
  status: fallback(z.string(), "all").default("all"),
  rating: fallback(z.string(), "all").default("all"),
  maturity: fallback(z.string(), "all").default("all"),
  yieldMin: fallback(z.string(), "").default(""),
  yieldMax: fallback(z.string(), "").default(""),
  esg: fallback(z.boolean(), false).default(false),
  aaoifi: fallback(z.boolean(), false).default(false),
  tokenized: fallback(z.boolean(), false).default(false),
  sort: fallback(z.string(), "yield").default("yield"),
});

export const Route = createFileRoute("/market")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Sukuk Screener — Filter Global Sukuk by Yield & Structure" },
      {
        name: "description",
        content:
          "Screen sukuk by country, structure (Ijarah, Wakalah, Murabahah), currency, rating, maturity and yield across Malaysia, the GCC, Indonesia, Türkiye and Pakistan.",
      },
      { property: "og:title", content: "Sukuk Screener — Sukuk Market" },
      { property: "og:description", content: "Filter every major sukuk issue by yield, rating, structure and ESG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: abs("/market") },
    ],
    links: [{ rel: "canonical", href: abs("/market") }],
    scripts: [
      ldScript(
        datasetLd({
          name: "Sukuk screener dataset",
          description:
            "Filterable dataset of global sukuk with issuer, structure, currency, profit rate, yield to maturity, ratings, Shariah certification and ESG status.",
          path: "/market",
        }),
      ),
      ldScript(breadcrumb([{ name: "Home", path: "/" }, { name: "Screener", path: "/market" }])),
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(sukukQuery());
  },
  component: MarketPage,
  errorComponent: () => <ErrorState />,
  notFoundComponent: () => <ErrorState />,
});

function ErrorState() {
  const { t } = useI18n();
  return <p className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-muted-foreground">{t("common.error")}</p>;
}

function MarketPage() {
  const { t } = useI18n();
  const { data: rows } = useSuspenseQuery(sukukQuery());
  const search = Route.useSearch() as MarketSearch;
  const navigate = useNavigate({ from: "/market" });

  return (
    <>
      <PageHeader title={t("screener.title")} subtitle={t("screener.sub")} />
      <MarketExplorer
        rows={rows}
        search={{ ...defaultSearch, ...search }}
        onChange={(patch) => navigate({ search: (prev: MarketSearch) => ({ ...prev, ...patch }) })}
        actions={<SaveScreenButton search={{ ...defaultSearch, ...search }} />}
      />
    </>
  );
}

function SaveScreenButton({ search }: { search: MarketSearch }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const save = useServerFn(saveScreen);
  const mutation = useMutation({
    mutationFn: (vars: { name: string; search: string }) => save({ data: vars }),
    onSuccess: () => {
      toast.success(t("action.saved"));
      setOpen(false);
      setName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  const qs = new URLSearchParams(
    Object.entries(search).map(([k, v]) => [k, String(v)]),
  ).toString();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("action.saveScreen")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("action.saveScreen")}</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 120))}
          placeholder={t("screens.namePlaceholder")}
        />
        <Button
          onClick={() => mutation.mutate({ name, search: qs })}
          disabled={mutation.isPending || name.trim().length === 0}
        >
          {t("common.save")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
