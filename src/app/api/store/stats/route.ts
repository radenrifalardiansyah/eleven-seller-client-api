import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const { supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const [products, orders, revenue, customers, lowStock] = await Promise.all([
      supabase!
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      supabase!
        .from("orders")
        .select("id, status", { count: "exact" }),

      supabase!
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered"),

      supabase!
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      supabase!
        .from("products")
        .select("id", { count: "exact", head: true })
        .lte("stock", 5)
        .eq("status", "active"),
    ]);

    const totalRevenue = (revenue.data ?? []).reduce(
      (sum, o) => sum + (o.total_amount ?? 0),
      0
    );

    const ordersByStatus = (orders.data ?? []).reduce(
      (acc: Record<string, number>, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return successResponse({
      total_products:     products.count  ?? 0,
      total_orders:       orders.count    ?? 0,
      total_customers:    customers.count ?? 0,
      low_stock_products: lowStock.count  ?? 0,
      total_revenue:      totalRevenue,
      orders_by_status:   ordersByStatus,
    });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
