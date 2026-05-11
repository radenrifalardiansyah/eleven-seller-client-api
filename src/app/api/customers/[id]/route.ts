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
      .from("customers")
      .select("*, customer_addresses(*)")
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Pelanggan tidak ditemukan", 404);

    const { data: orders } = await supabase!
      .from("orders")
      .select("id, order_number, status, total_amount, order_date")
      .eq("customer_id", id)
      .order("order_date", { ascending: false })
      .limit(10);

    return successResponse({ ...data, recent_orders: orders ?? [] });
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
    const { name, phone, segment, status } = body;

    const patch: Record<string, unknown> = {};
    if (name    !== undefined) patch.name    = name;
    if (phone   !== undefined) patch.phone   = phone;
    if (segment !== undefined) patch.segment = segment;
    if (status  !== undefined) patch.status  = status;

    const { data, error: dbError } = await supabase!
      .from("customers")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Pelanggan tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
