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
      .from("products")
      .select(
        "*, categories(id, name), product_images(id, image_url, alt_text, is_primary, sort_order), stock_distribution(warehouse_id, quantity, warehouses(id, name, code))"
      )
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Produk tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { name, description, sku, price, weight, dimensions, category_id, status, featured } = body;

    if (price !== undefined && price < 0) return errorResponse("Harga tidak boleh negatif");

    const patch: Record<string, unknown> = {};
    if (name        !== undefined) patch.name        = name;
    if (description !== undefined) patch.description = description;
    if (sku         !== undefined) patch.sku         = sku;
    if (price       !== undefined) patch.price       = price;
    if (weight      !== undefined) patch.weight      = weight;
    if (dimensions  !== undefined) patch.dimensions  = dimensions;
    if (category_id !== undefined) patch.category_id = category_id;
    if (status      !== undefined) patch.status      = status;
    if (featured    !== undefined) patch.featured    = featured;

    const { data, error: dbError } = await supabase!
      .from("products")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Produk tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { error: dbError } = await supabase!
      .from("products")
      .delete()
      .eq("id", id);

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Produk berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
