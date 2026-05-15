import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("email dan password wajib diisi");
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return errorResponse(error.message, 401);

    const { data: profile } = await supabase
      .from("tenant_users")
      .select("id, tenant_id, role, name, phone, avatar_url, status, tenants(id, subdomain, store_name, logo_url, status)")
      .eq("user_id", data.user.id)
      .single();

    return successResponse({ user: data.user, session: data.session, profile });
  } catch (e) {
    return errorResponse(`Internal server error: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
}
