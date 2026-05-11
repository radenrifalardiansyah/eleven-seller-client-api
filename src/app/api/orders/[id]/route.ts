import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

type Params = { params: Promise<{ id: string }> };

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("orders")
      .select(
        `*, customers(id, name, email, phone),
         order_items(id, product_id, product_name, product_sku, quantity, unit_price, total_price),
         payments(id, payment_method, amount, status, transaction_id, paid_at),
         order_return_requests(id, type, reason, status, request_date)`
      )
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Order tidak ditemukan", 404);

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
    const { status, tracking_number, courier, notes, cancel_reason } = body;

    if (!status) return errorResponse("status wajib diisi");
    if (!ORDER_STATUSES.includes(status)) {
      return errorResponse(`Status tidak valid. Pilihan: ${ORDER_STATUSES.join(", ")}`);
    }

    const patch: Record<string, unknown> = { status };
    if (tracking_number !== undefined) patch.tracking_number = tracking_number;
    if (courier         !== undefined) patch.courier         = courier;
    if (notes           !== undefined) patch.notes           = notes;
    if (status === "shipped")   patch.shipped_at    = new Date().toISOString();
    if (status === "delivered") patch.delivered_at  = new Date().toISOString();
    if (status === "cancelled") {
      patch.cancelled_at  = new Date().toISOString();
      patch.cancel_reason = cancel_reason ?? null;
    }

    const { data, error: dbError } = await supabase!
      .from("orders")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Order tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
