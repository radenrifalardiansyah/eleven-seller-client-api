import { NextRequest } from "next/server";
import { createAdminClient, createServiceClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, owner_name, store_name, subdomain, phone } = body;

    if (!email || !password || !owner_name || !store_name || !subdomain) {
      return errorResponse("email, password, owner_name, store_name, dan subdomain wajib diisi");
    }

    const adminClient = createAdminClient();
    const serviceClient = await createServiceClient();

    const { data: existing } = await serviceClient
      .from("tenants")
      .select("id")
      .eq("subdomain", subdomain.toLowerCase())
      .single();

    if (existing) return errorResponse("Subdomain sudah digunakan", 409);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: owner_name },
    });

    if (authError) return errorResponse(authError.message);
    if (!authData.user) return errorResponse("Gagal membuat akun");

    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .insert({
        subdomain:  subdomain.toLowerCase(),
        store_name,
        owner_name,
        email,
        phone: phone ?? null,
      })
      .select()
      .single();

    if (tenantError) return errorResponse(tenantError.message);

    const { data: tenantUser, error: userError } = await serviceClient
      .from("tenant_users")
      .insert({
        user_id:   authData.user.id,
        tenant_id: tenant.id,
        name:      owner_name,
        email,
        role:      "owner",
      })
      .select()
      .single();

    if (userError) return errorResponse(userError.message);

    await serviceClient
      .from("store_settings")
      .insert({ tenant_id: tenant.id });

    return successResponse({ user: authData.user, tenant, tenant_user: tenantUser }, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
