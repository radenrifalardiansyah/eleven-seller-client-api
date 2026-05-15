import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    const { data, error: dbError, count } = await supabase!
      .from("vouchers")
      .select("*", { count: "exact" })
      .eq("tenant_id", seller!.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to);

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
    const { code, name, description, type, value, min_purchase, max_discount, quota, start_date, end_date } = body;

    if (!code || !name || !type || value === undefined || !start_date || !end_date) {
      return errorResponse("code, name, type, value, start_date, dan end_date wajib diisi");
    }
    if (!["percentage", "fixed"].includes(type)) {
      return errorResponse("type tidak valid. Pilihan: percentage, fixed");
    }

    const { data, error: dbError } = await supabase!
      .from("vouchers")
      .insert({
        tenant_id:    seller!.tenant_id,
        code:         code.toUpperCase(),
        name,
        description:  description  ?? null,
        type,
        value,
        min_purchase: min_purchase ?? 0,
        max_discount: max_discount ?? null,
        quota:        quota        ?? 1,
        start_date,
        end_date,
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
