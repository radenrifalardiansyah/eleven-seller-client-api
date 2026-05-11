import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, company_name, company_code, phone } = body;

    if (!email || !password || !full_name || !company_name || !company_code) {
      return errorResponse("email, password, full_name, company_name, dan company_code wajib diisi");
    }

    const serviceClient = await createServiceClient();

    const { data: existing } = await serviceClient
      .from("companies")
      .select("id")
      .eq("code", company_code.toUpperCase())
      .single();

    if (existing) return errorResponse("Company code sudah digunakan", 409);

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (authError) return errorResponse(authError.message);
    if (!authData.user) return errorResponse("Gagal membuat akun");

    const { data: company, error: companyError } = await serviceClient
      .from("companies")
      .insert({ name: company_name, code: company_code.toUpperCase() })
      .select()
      .single();

    if (companyError) return errorResponse(companyError.message);

    const { data: sellerProfile, error: profileError } = await serviceClient
      .from("seller_profiles")
      .insert({
        id: authData.user.id,
        company_id: company.id,
        role: "owner",
        full_name,
        phone: phone ?? null,
      })
      .select()
      .single();

    if (profileError) return errorResponse(profileError.message);

    await serviceClient
      .from("store_settings")
      .insert({ company_id: company.id, store_name: company_name });

    return successResponse({ user: authData.user, company, seller_profile: sellerProfile }, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
