import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { imageId } = await params;
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { error: dbError } = await supabase!
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (dbError) return errorResponse(dbError.message);

    return successResponse({ message: "Gambar berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
