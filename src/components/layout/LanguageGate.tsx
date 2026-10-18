import { Globe } from "lucide-react";

import { LOCALES, useI18n } from "@/i18n";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * First-visit language chooser. The picked locale is stored as the visitor's
 * default, so it never asks again — they can still change it from the header.
 */
export function LanguageGate() {
  const { hasChosenLang, setLang, lang } = useI18n();

  return (
    <Dialog open={!hasChosenLang}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Choose your language</DialogTitle>
          <DialogDescription>
            اختر لغتك · Pilih bahasa anda — we&apos;ll remember it for next time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {LOCALES.map((l) => (
            <Button
              key={l.code}
              variant={l.code === lang ? "default" : "outline"}
              className="h-12 justify-between text-base"
              dir={l.dir}
              onClick={() => setLang(l.code)}
            >
              <span>{l.label}</span>
              <span className="text-xs opacity-70">{l.englishLabel}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
