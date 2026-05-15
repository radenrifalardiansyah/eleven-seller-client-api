import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page")     ?? "1");
    const limit    = parseInt(searchParams.get("limit")    ?? "10");
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";
    const status   = searchParams.get("status")   ?? "";
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    let query = supabase!
      .from("products")
      .select(
        "*, categories(id, name), product_images(id, image_url, is_primary, sort_order), stock_distribution(warehouse_id, quantity)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search)   query = query.ilike("name", `%${search}%`);
    if (category) query = query.eq("category_id", category);
    if (status)   query = query.eq("status", status);

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
    const { name, description, sku, price, weight, dimensions, category_id, status, featured } = body;

    if (!name || !sku || price === undefined) {
      return errorResponse("name, sku, dan price wajib diisi");
    }
    if (price < 0) return errorResponse("Harga tidak boleh negatif");

    const { data, error: dbError } = await supabase!
      .from("products")
      .insert({
        tenant_id:   seller!.tenant_id,
        name,
        description: description ?? null,
        sku,
        price,
        weight:      weight      ?? 0,
        dimensions:  dimensions  ?? null,
        category_id: category_id ?? null,
        status:      status      ?? "active",
        featured:    featured    ?? false,
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
