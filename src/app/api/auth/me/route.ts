import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("Unauthorized", 401);

    const { data: profile } = await supabase
      .from("seller_profiles")
      .select("*, companies(id, code, name, logo_url, status)")
      .eq("id", user.id)
      .single();

    return successResponse({ user, profile });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
