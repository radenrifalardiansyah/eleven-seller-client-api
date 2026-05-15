import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("Unauthorized", 401);

    const { data: profile } = await supabase
      .from("tenant_users")
      .select("*, tenants(id, subdomain, store_name, logo_url, primary_color, status)")
      .eq("user_id", user.id)
      .single();

    return successResponse({ user, profile });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 8) {
      return errorResponse("Kata sandi baru minimal 8 karakter");
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return errorResponse(error.message);

    return successResponse({ message: "Kata sandi berhasil diubah" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
