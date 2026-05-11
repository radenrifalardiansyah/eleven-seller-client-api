import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { errorResponse, paginatedResponse } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page           = parseInt(searchParams.get("page")           ?? "1");
    const limit          = parseInt(searchParams.get("limit")          ?? "10");
    const status         = searchParams.get("status")         ?? "";
    const payment_status = searchParams.get("payment_status") ?? "";
    const search         = searchParams.get("search")         ?? "";
    const date_from      = searchParams.get("date_from")      ?? "";
    const date_to        = searchParams.get("date_to")        ?? "";
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    let query = supabase!
      .from("orders")
      .select(
        `*, customers(id, name, email, phone),
         order_items(id, product_name, product_sku, quantity, unit_price, total_price)`,
        { count: "exact" }
      )
      .order("order_date", { ascending: false })
      .range(from, to);

    if (status)         query = query.eq("status", status);
    if (payment_status) query = query.eq("payment_status", payment_status);
    if (search)         query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    if (date_from)      query = query.gte("order_date", date_from);
    if (date_to)        query = query.lte("order_date", date_to);

    const { data, error: dbError, count } = await query;
    if (dbError) return errorResponse(dbError.message);

    return paginatedResponse(data ?? [], { page, limit, total: count ?? 0 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
