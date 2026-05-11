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
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError || !data) return errorResponse("Kategori tidak ditemukan", 404);

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
    const { name, description, image_url, is_active } = body;

    const patch: Record<string, unknown> = {};
    if (name        !== undefined) patch.name        = name;
    if (description !== undefined) patch.description = description;
    if (image_url   !== undefined) patch.image_url   = image_url;
    if (is_active   !== undefined) patch.is_active   = is_active;

    const { data, error: dbError } = await supabase!
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Kategori tidak ditemukan", 404);

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
      .from("categories")
      .delete()
      .eq("id", id);

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Kategori berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
