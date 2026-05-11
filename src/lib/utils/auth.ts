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
    .from("seller_profiles")
    .select("id, company_id, role, full_name, phone, avatar_url, is_active")
    .eq("id", user.id)
    .single();

  if (sellerError || !seller) {
    return { user, seller: null, supabase: null, error: errorResponse("Profil seller tidak ditemukan", 404) };
  }

  return { user, seller, supabase, error: null };
}
