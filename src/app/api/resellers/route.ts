import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page   = parseInt(searchParams.get("page")   ?? "1");
    const limit  = parseInt(searchParams.get("limit")  ?? "10");
    const status = searchParams.get("status") ?? "";
    const tier   = searchParams.get("tier")   ?? "";
    const search = searchParams.get("search") ?? "";
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    let query = supabase!
      .from("resellers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (tier)   query = query.eq("tier", tier);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

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
    const { name, email, phone, city, address, referral_code } = body;

    if (!name || !email || !referral_code) {
      return errorResponse("name, email, dan referral_code wajib diisi");
    }

    const { data, error: dbError } = await supabase!
      .from("resellers")
      .insert({
        company_id:    seller!.company_id,
        name,
        email,
        phone:         phone         ?? null,
        city:          city          ?? null,
        address:       address       ?? null,
        referral_code: referral_code.toUpperCase(),
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
