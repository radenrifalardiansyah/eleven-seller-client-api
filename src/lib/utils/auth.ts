import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { errorResponse } from "./response";

export async function getAuthenticatedSeller() {
  const headerStore = await headers();
  const authHeader = headerStore.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearerToken}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        }
      )
    : await createClient();

  const {
    data: { user },
    error: authError,
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, seller: null, supabase: null, error: errorResponse("Unauthorized", 401) };
  }

  const { data: seller, error: sellerError } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role, name, avatar_url, status")
    .eq("user_id", user.id)
    .single();

  if (sellerError || !seller) {
    return { user, seller: null, supabase: null, error: errorResponse("Profil pengguna tidak ditemukan", 404) };
  }

  return { user, seller, supabase, error: null };
}
