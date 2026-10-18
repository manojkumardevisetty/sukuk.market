import { AlertTriangle } from "lucide-react";

import { useI18n } from "@/i18n";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const DISCLAIMER_KEY = "sukuk-market-disclaimer";

export function DisclaimerGate({ open, onAck }: { open: boolean; onAck: () => void }) {
  const { t } = useI18n();

  const handleAck = () => {
    window.localStorage.setItem(DISCLAIMER_KEY, "1");
    onAck();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <DialogTitle>{t("disclaimer.title")}</DialogTitle>
          <DialogDescription>{t("disclaimer.short")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground">{t("disclaimer")}</p>
          <Button onClick={handleAck} className="w-full">
            {t("disclaimer.accept")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
