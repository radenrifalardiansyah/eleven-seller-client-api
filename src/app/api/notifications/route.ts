import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page   = parseInt(searchParams.get("page")   ?? "1");
    const limit  = parseInt(searchParams.get("limit")  ?? "20");
    const status = searchParams.get("status") ?? "";
    const type   = searchParams.get("type")   ?? "";
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    let query = supabase!
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("tenant_id", seller!.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (type)   query = query.eq("type", type);

    const { data, error: dbError, count } = await query;
    if (dbError) return errorResponse(dbError.message);

    return paginatedResponse(data ?? [], { page, limit, total: count ?? 0 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT() {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { error: dbError } = await supabase!
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("tenant_id", seller!.tenant_id)
      .eq("status", "unread");

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Semua notifikasi ditandai sudah dibaca" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
