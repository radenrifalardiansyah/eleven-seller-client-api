import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(_req: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("tenant_users")
      .select("id, user_id, name, email, role, status, avatar_url, created_at")
      .eq("tenant_id", seller!.tenant_id)
      .order("created_at", { ascending: true });

    if (dbError) return errorResponse(dbError.message);

    // Ambil last_sign_in_at dari auth.users via admin client
    const adminClient = createAdminClient();
    const userIds = (data ?? []).map((u) => u.user_id).filter(Boolean);

    const lastLoginMap: Record<string, string | null> = {};
    for (const uid of userIds) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(uid);
      lastLoginMap[uid] = authUser?.user?.last_sign_in_at ?? null;
    }

    const result = (data ?? []).map((u) => ({
      ...u,
      last_login: lastLoginMap[u.user_id] ?? null,
    }));

    return successResponse(result);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    if (seller!.role !== "owner" && seller!.role !== "admin") {
      return errorResponse("Tidak memiliki izin", 403);
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("name, email, dan password wajib diisi");
    }
    if (!["admin", "staff"].includes(role)) {
      return errorResponse("role tidak valid. Pilihan: admin, staff");
    }
    if (password.length < 8) {
      return errorResponse("Password minimal 8 karakter");
    }

    const { data: existing } = await supabase!
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", seller!.tenant_id)
      .eq("email", email)
      .single();

    if (existing) return errorResponse("Email sudah terdaftar di tim ini", 409);

    const adminClient = createAdminClient();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) return errorResponse(authError.message);
    if (!authData.user) return errorResponse("Gagal membuat akun");

    const { data: teamUser, error: dbError } = await supabase!
      .from("tenant_users")
      .insert({
        user_id:   authData.user.id,
        tenant_id: seller!.tenant_id,
        name,
        email,
        role,
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return errorResponse(dbError.message);
    }

    return successResponse(teamUser, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
