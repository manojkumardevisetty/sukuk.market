import type { SupabaseClient } from "@supabase/supabase-js";

/** Throws unless the calling user holds the admin role. */
export async function assertAdmin(context: { supabase: SupabaseClient<any>; userId: string }) {
  const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (!(roles ?? []).some((r: { role: string }) => r.role === "admin")) throw new Error("Forbidden");
}
