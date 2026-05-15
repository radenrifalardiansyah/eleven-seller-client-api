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
      .from("resellers")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Reseller tidak ditemukan", 404);

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
    const { name, phone, city, address, tier, status, notes } = body;

    if (status && !["active", "pending", "suspended"].includes(status)) {
      return errorResponse("status tidak valid. Pilihan: active, pending, suspended");
    }
    if (tier && !["Bronze", "Silver", "Gold", "Platinum"].includes(tier)) {
      return errorResponse("tier tidak valid. Pilihan: Bronze, Silver, Gold, Platinum");
    }

    const patch: Record<string, unknown> = {};
    if (name    !== undefined) patch.name    = name;
    if (phone   !== undefined) patch.phone   = phone;
    if (city    !== undefined) patch.city    = city;
    if (address !== undefined) patch.address = address;
    if (tier    !== undefined) patch.tier    = tier;
    if (status  !== undefined) patch.status  = status;
    if (notes   !== undefined) patch.notes   = notes;

    const { data, error: dbError } = await supabase!
      .from("resellers")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Reseller tidak ditemukan", 404);

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
      .from("resellers")
      .delete()
      .eq("id", id);

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Reseller berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
