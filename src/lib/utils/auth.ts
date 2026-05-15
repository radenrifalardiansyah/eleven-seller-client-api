import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "./response";

export async function getAuthenticatedSeller() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, seller: null, supabase: null, error: errorResponse("Unauthorized", 401) };
  }

  const { data: seller, error: sellerError } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role, name, avatar_url, status")
    .eq("user_id", user.id)
    .single();

  if (sellerError || !seller) {
    const msg = sellerError ? sellerError.message : "no row returned";
    return { user, seller: null, supabase: null, error: errorResponse(`Profil pengguna tidak ditemukan: ${msg}`, 404) };
  }

  return { user, seller, supabase, error: null };
}
