import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const subdomain = params.get("subdomain") ?? params.get("tenant");

  if (!subdomain) {
    return errorResponse("Parameter subdomain atau tenant wajib diisi", 400);
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("id, subdomain, store_name, logo_url, primary_color, status")
      .eq("subdomain", subdomain)
      .single();

    if (error || !data) {
      return errorResponse("Tenant tidak ditemukan", 404);
    }

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
