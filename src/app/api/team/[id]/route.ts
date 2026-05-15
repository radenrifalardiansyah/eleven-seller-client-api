import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    if (seller!.role !== "owner" && seller!.role !== "admin") {
      return errorResponse("Tidak memiliki izin", 403);
    }

    const { data: target, error: findError } = await supabase!
      .from("tenant_users")
      .select("id, role, user_id")
      .eq("id", id)
      .eq("tenant_id", seller!.tenant_id)
      .single();

    if (findError || !target) return errorResponse("User tidak ditemukan", 404);
    if (target.role === "owner") return errorResponse("Role owner tidak dapat diubah", 403);

    const body = await request.json();
    const { name, role, status } = body;

    if (role && !["admin", "staff"].includes(role)) {
      return errorResponse("role tidak valid. Pilihan: admin, staff");
    }
    if (status && !["active", "inactive"].includes(status)) {
      return errorResponse("status tidak valid. Pilihan: active, inactive");
    }

    const patch: Record<string, unknown> = {};
    if (name   !== undefined) patch.name   = name;
    if (role   !== undefined) patch.role   = role;
    if (status !== undefined) patch.status = status;

    const { data, error: dbError } = await supabase!
      .from("tenant_users")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (dbError || !data) return errorResponse("Gagal mengupdate user", 500);

    return successResponse(data);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    if (seller!.role !== "owner" && seller!.role !== "admin") {
      return errorResponse("Tidak memiliki izin", 403);
    }

    const { data: target, error: findError } = await supabase!
      .from("tenant_users")
      .select("id, role, user_id")
      .eq("id", id)
      .eq("tenant_id", seller!.tenant_id)
      .single();

    if (findError || !target) return errorResponse("User tidak ditemukan", 404);
    if (target.role === "owner") return errorResponse("Owner tidak dapat dihapus", 403);

    const { error: dbError } = await supabase!
      .from("tenant_users")
      .delete()
      .eq("id", id);

    if (dbError) return errorResponse(dbError.message);

    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(target.user_id);

    return successResponse({ message: "User berhasil dihapus" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
