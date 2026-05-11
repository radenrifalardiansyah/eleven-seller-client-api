import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) return errorResponse(error.message);

    return successResponse({ message: "Logout berhasil" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
