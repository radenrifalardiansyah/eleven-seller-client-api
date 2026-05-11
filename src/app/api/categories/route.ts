import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { data, error: dbError } = await supabase!
      .from("categories")
      .select("*")
      .order("name");

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data ?? []);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { name, description, image_url } = body;

    if (!name) return errorResponse("name wajib diisi");

    const { data, error: dbError } = await supabase!
      .from("categories")
      .insert({
        company_id:  seller!.company_id,
        name,
        description: description ?? null,
        image_url:   image_url   ?? null,
      })
      .select()
      .single();

    if (dbError) return errorResponse(dbError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
