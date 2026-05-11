import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("store_settings")
      .select("*")
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
      store_name, description, address, city, province, postal_code,
      phone, email, website, operational_hours, logo_url, tagline,
      banner_image_url, show_reviews, show_best_sellers,
      free_shipping_min, packaging_fee, processing_days, theme_color,
      notif_email_new_order, notif_sms_payment, notif_push,
      notif_email_low_stock, notif_email_promotion,
    } = body;

    const patch: Record<string, unknown> = {};
    const fields = {
      store_name, description, address, city, province, postal_code,
      phone, email, website, operational_hours, logo_url, tagline,
      banner_image_url, show_reviews, show_best_sellers,
      free_shipping_min, packaging_fee, processing_days, theme_color,
      notif_email_new_order, notif_sms_payment, notif_push,
      notif_email_low_stock, notif_email_promotion,
    };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }

    const { data, error: dbError } = await supabase!
      .from("store_settings")
      .update(patch)
      .eq("company_id", seller!.company_id)
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
