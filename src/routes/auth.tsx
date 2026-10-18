import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Sukuk Market" },
      { name: "description", content: "Sign in to save sukuk screens, favourites and yield alerts." },
      { property: "og:title", content: "Sign in — Sukuk Market" },
      { property: "og:description", content: "Access your saved screens, favourites and alerts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/market" });
        else toast.success(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/market" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? "Sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/market" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold">{t("auth.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.sub")}</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
        {mode === "signup" ? (
          <div>
            <Label>{t("auth.fullName")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value.slice(0, 120))} className="mt-1" />
          </div>
        ) : null}
        <div>
          <Label>{t("auth.email")}</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>{t("auth.password")}</Label>
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "signin" ? t("auth.signin") : t("auth.signup")}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => oauth("google")}>
          {t("auth.google")}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => oauth("apple")}>
          {t("auth.apple")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
        </button>
      </form>
    </div>
  );
}
