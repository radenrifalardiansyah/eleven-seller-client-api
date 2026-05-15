import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("store_settings")
      .select("*, tenants(id, subdomain, store_name, logo_url, primary_color, status)")
      .eq("tenant_id", seller!.tenant_id)
      .single();

    if (dbError || !data) return errorResponse("Pengaturan toko tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const {
      description, address, city, province, postal_code,
      phone, email, website, operational_hours, theme_color, tagline,
      banner_url, show_reviews, show_best_sellers,
      free_shipping_min, packaging_fee, processing_days,
      notif_email_new_order, notif_sms_payment, notif_push,
      notif_email_low_stock, notif_email_promotion,
    } = body;

    const patch: Record<string, unknown> = {};
    const fields = {
      description, address, city, province, postal_code,
      phone, email, website, operational_hours, theme_color, tagline,
      banner_url, show_reviews, show_best_sellers,
      free_shipping_min, packaging_fee, processing_days,
      notif_email_new_order, notif_sms_payment, notif_push,
      notif_email_low_stock, notif_email_promotion,
    };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }

    const { data, error: dbError } = await supabase!
      .from("store_settings")
      .update(patch)
      .eq("tenant_id", seller!.tenant_id)
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
