import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deleteAlert,
  deleteSavedScreen,
  getAlerts,
  getMyActivity,
  getSavedScreens,
  updateProfile,
} from "@/lib/user.functions";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Sukuk Market" },
      { name: "description", content: "Manage your profile, enquiries and subscription requests." },
      { property: "og:title", content: "Account — Sukuk Market" },
      { property: "og:description", content: "Manage your profile and requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t, locale, lang } = useI18n();
  const queryClient = useQueryClient();
  const fetchActivity = useServerFn(getMyActivity);
  const save = useServerFn(updateProfile);
  const { data } = useQuery({ queryKey: ["activity"], queryFn: () => fetchActivity() });

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name ?? "");
      setCountry(data.profile.country ?? "");
    }
  }, [data?.profile]);

  const mutation = useMutation({
    mutationFn: () => save({ data: { fullName, country, preferredLanguage: lang } }),
    onSuccess: () => {
      toast.success(t("account.saved"));
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={t("account.title")} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">{t("account.profile")}</h2>
          <div className="mt-4 space-y-3">
            <div>
              <Label>{t("auth.fullName")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value.slice(0, 120))} className="mt-1" />
            </div>
            <div>
              <Label>{t("filter.country")}</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value.slice(0, 80))} className="mt-1" />
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {t("account.save")}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">{t("account.enquiries")}</h2>
          <div className="mt-4 space-y-3">
            {(data?.enquiries ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.noEnquiries")}</p>
            ) : (
              data?.enquiries.map((e) => (
                <div key={e.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{e.subject}</p>
                    <Badge variant="secondary">{e.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.created_at, locale)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">{t("account.requests")}</h2>
          <div className="mt-4 space-y-3">
            {(data?.requests ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.noRequests")}</p>
            ) : (
              data?.requests.map((r) => (
                <div key={r.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="tnum truncate text-sm font-medium">
                      {r.currency} {r.amount}
                    </p>
                    <Badge variant="secondary">{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at, locale)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-2">
        <SavedScreensSection />
        <AlertsSection />
      </div>
    </>
  );
}

function SavedScreensSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const list = useServerFn(getSavedScreens);
  const remove = useServerFn(deleteSavedScreen);
  const { data } = useQuery({ queryKey: ["saved-screens"], queryFn: () => list() });
  const mutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-screens"] }),
  });

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("screens.title")}</h2>
      <div className="mt-4 space-y-3">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("screens.empty")}</p>
        ) : (
          data?.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <Link
                to="/market"
                search={Object.fromEntries(new URLSearchParams(s.search)) as never}
                className="truncate text-sm font-medium hover:text-primary"
              >
                {s.name}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => mutation.mutate(s.id)}>
                {t("common.delete")}
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function AlertsSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const list = useServerFn(getAlerts);
  const remove = useServerFn(deleteAlert);
  const { data } = useQuery({ queryKey: ["alerts"], queryFn: () => list() });
  const mutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("alerts.title")}</h2>
      <div className="mt-4 space-y-3">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("alerts.empty")}</p>
        ) : (
          data?.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <p className="tnum truncate text-sm">
                {a.instruments?.name ?? "—"} · {t(`alerts.${a.metric}`)}{" "}
                {a.direction === "above" ? "≥" : "≤"} {a.threshold}
              </p>
              <Button variant="ghost" size="sm" onClick={() => mutation.mutate(a.id)}>
                {t("common.delete")}
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
