import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("sort_order");

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data ?? []);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { image_url, alt_text, is_primary, sort_order } = body;

    if (!image_url) return errorResponse("image_url wajib diisi");

    if (is_primary) {
      await supabase!
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", id);
    }

    const { data, error: dbError } = await supabase!
      .from("product_images")
      .insert({
        product_id: id,
        image_url,
        alt_text:   alt_text   ?? null,
        is_primary: is_primary ?? false,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
