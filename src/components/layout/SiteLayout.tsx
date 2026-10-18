import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { LanguageGate } from "./LanguageGate";
import { DisclaimerGate, DISCLAIMER_KEY } from "./DisclaimerGate";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [disclaimerAck, setDisclaimerAck] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(DISCLAIMER_KEY);
    setDisclaimerAck(stored === "1");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <DisclaimerGate open={!disclaimerAck} onAck={() => setDisclaimerAck(true)} />
      {disclaimerAck && <LanguageGate />}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-surface geo-pattern">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-4 py-10 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
