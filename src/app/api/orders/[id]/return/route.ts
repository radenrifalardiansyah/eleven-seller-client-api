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
      .from("order_returns")
      .select("*")
      .eq("order_id", id)
      .order("request_date", { ascending: false });

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data ?? []);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { type, reason, notes } = body;

    if (!type || !reason) return errorResponse("type dan reason wajib diisi");
    if (!["return_item", "refund_only"].includes(type)) {
      return errorResponse("type tidak valid. Pilihan: return_item, refund_only");
    }

    const { data, error: dbError } = await supabase!
      .from("order_returns")
      .insert({ order_id: id, type, reason, notes: notes ?? null })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
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
    const { return_id, status } = body;

    if (!return_id || !status) return errorResponse("return_id dan status wajib diisi");
    if (!["approved", "rejected", "completed"].includes(status)) {
      return errorResponse("status tidak valid. Pilihan: approved, rejected, completed");
    }

    const patch: Record<string, unknown> = { status };
    if (status === "completed" || status === "rejected") {
      patch.resolved_at = new Date().toISOString();
    }

    const { data, error: dbError } = await supabase!
      .from("order_returns")
      .update(patch)
      .eq("id", return_id)
      .eq("order_id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Return request tidak ditemukan", 404);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
