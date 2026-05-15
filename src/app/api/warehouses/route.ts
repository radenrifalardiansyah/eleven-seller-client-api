import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("warehouses")
      .select("*, stock_distribution(product_id, quantity)")
      .eq("tenant_id", seller!.tenant_id)
      .order("is_primary", { ascending: false })
      .order("name");

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data ?? []);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { code, name, address, city, pic, phone, is_primary } = body;

    if (!code || !name) return errorResponse("code dan name wajib diisi");

    const { data, error: dbError } = await supabase!
      .from("warehouses")
      .insert({
        tenant_id:  seller!.tenant_id,
        code:       code.toUpperCase(),
        name,
        address:    address    ?? null,
        city:       city       ?? null,
        pic:        pic        ?? null,
        phone:      phone      ?? null,
        is_primary: is_primary ?? false,
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
