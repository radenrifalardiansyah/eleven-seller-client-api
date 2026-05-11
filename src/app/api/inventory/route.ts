import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page       = parseInt(searchParams.get("page")       ?? "1");
    const limit      = parseInt(searchParams.get("limit")      ?? "20");
    const product_id = searchParams.get("product_id") ?? "";
    const movement   = searchParams.get("movement")   ?? "";
    const from       = (page - 1) * limit;
    const to         = from + limit - 1;

    let query = supabase!
      .from("inventory_logs")
      .select(
        `*, products(id, name, sku), seller_profiles(id, full_name)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (product_id) query = query.eq("product_id", product_id);
    if (movement)   query = query.eq("movement_type", movement);

    const { data, error: dbError, count } = await query;
    if (dbError) return errorResponse(dbError.message);

    return paginatedResponse(data ?? [], { page, limit, total: count ?? 0 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { product_id, movement_type, quantity, reference_type, reference_id, notes } = body;

    if (!product_id || !movement_type || quantity === undefined || !reference_type) {
      return errorResponse("product_id, movement_type, quantity, dan reference_type wajib diisi");
    }
    if (!["in", "out", "adjustment"].includes(movement_type)) {
      return errorResponse("movement_type tidak valid. Pilihan: in, out, adjustment");
    }

    const { data: product, error: productError } = await supabase!
      .from("products")
      .select("stock")
      .eq("id", product_id)
      .single();

    if (productError || !product) return errorResponse("Produk tidak ditemukan", 404);

    const previousStock = product.stock;
    let newStock = previousStock;

    if (movement_type === "in")         newStock = previousStock + quantity;
    else if (movement_type === "out")   newStock = previousStock - quantity;
    else if (movement_type === "adjustment") newStock = quantity;

    if (newStock < 0) return errorResponse("Stok tidak cukup");

    await supabase!.from("products").update({ stock: newStock }).eq("id", product_id);

    const { data, error: logError } = await supabase!
      .from("inventory_logs")
      .insert({
        company_id:     seller!.company_id,
        product_id,
        movement_type,
        quantity,
        previous_stock: previousStock,
        new_stock:      newStock,
        reference_type,
        reference_id:   reference_id ?? null,
        notes:          notes        ?? null,
        created_by:     seller!.id,
      })
      .select()
      .single();

    if (logError) return errorResponse(logError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
