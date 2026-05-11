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
      .from("vouchers")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Voucher tidak ditemukan", 404);

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
    const { name, description, value, min_purchase, max_discount, quota, start_date, end_date, is_disabled } = body;

    const patch: Record<string, unknown> = {};
    if (name         !== undefined) patch.name         = name;
    if (description  !== undefined) patch.description  = description;
    if (value        !== undefined) patch.value        = value;
    if (min_purchase !== undefined) patch.min_purchase = min_purchase;
    if (max_discount !== undefined) patch.max_discount = max_discount;
    if (quota        !== undefined) patch.quota        = quota;
    if (start_date   !== undefined) patch.start_date   = start_date;
    if (end_date     !== undefined) patch.end_date     = end_date;
    if (is_disabled  !== undefined) patch.is_disabled  = is_disabled;

    const { data, error: dbError } = await supabase!
      .from("vouchers")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Voucher tidak ditemukan", 404);

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
      .from("vouchers")
      .delete()
      .eq("id", id);

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Voucher berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
