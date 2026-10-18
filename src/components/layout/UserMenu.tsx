import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";

import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />;

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link to="/auth">{t("nav.signin")}</Link>
      </Button>
    );
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserRound className="h-4 w-4" />
          <span className="max-w-28 truncate text-xs">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/watchlist">{t("nav.watchlist")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/portfolio">{t("nav.portfolio")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account">{t("nav.account")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/admin">{t("nav.admin")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>{t("nav.signout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
