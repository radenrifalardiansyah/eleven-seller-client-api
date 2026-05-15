import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page    = parseInt(searchParams.get("page")    ?? "1");
    const limit   = parseInt(searchParams.get("limit")   ?? "10");
    const search  = searchParams.get("search")  ?? "";
    const segment = searchParams.get("segment") ?? "";
    const status  = searchParams.get("status")  ?? "";
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    let query = supabase!
      .from("customers")
      .select("*", { count: "exact" })
      .eq("tenant_id", seller!.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search)  query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (segment) query = query.eq("segment", segment);
    if (status)  query = query.eq("status", status);

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
    const { name, email, phone, address, date_of_birth, gender, segment } = body;

    if (!name || !email) return errorResponse("name dan email wajib diisi");

    const { data, error: dbError } = await supabase!
      .from("customers")
      .insert({
        tenant_id:     seller!.tenant_id,
        name,
        email,
        phone:         phone         ?? null,
        address:       address       ?? null,
        date_of_birth: date_of_birth ?? null,
        gender:        gender        ?? null,
        segment:       segment       ?? "New",
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
