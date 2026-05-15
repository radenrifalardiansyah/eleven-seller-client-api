import { NextRequest } from "next/server";
import { getAuthenticatedSeller } from "@/lib/utils/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/response";

const MOVEMENT_TYPES = [
  "adjustment_in", "adjustment_out",
  "transfer_in", "transfer_out",
  "sale", "restock",
] as const;

export async function GET(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page         = parseInt(searchParams.get("page")         ?? "1");
    const limit        = parseInt(searchParams.get("limit")        ?? "20");
    const product_id   = searchParams.get("product_id")   ?? "";
    const warehouse_id = searchParams.get("warehouse_id") ?? "";
    const type         = searchParams.get("type")         ?? "";
    const from         = (page - 1) * limit;
    const to           = from + limit - 1;

    let query = supabase!
      .from("stock_movements")
      .select(
        "*, products(id, name, sku), warehouses!warehouse_id(id, name, code)",
        { count: "exact" }
      )
      .eq("tenant_id", seller!.tenant_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (product_id)   query = query.eq("product_id", product_id);
    if (warehouse_id) query = query.eq("warehouse_id", warehouse_id);
    if (type)         query = query.eq("type", type);

    const { data, error: dbError, count } = await query;
    if (dbError) return errorResponse(dbError.message);

    return paginatedResponse(data ?? [], { page, limit, total: count ?? 0 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { seller, supabase, error } = await getAuthenticatedSeller();
    if (error) return error;

    const body = await request.json();
    const { product_id, warehouse_id, type, qty, reason, reference_type, reference_id, ref_warehouse_id } = body;

    if (!product_id || !warehouse_id || !type || qty === undefined) {
      return errorResponse("product_id, warehouse_id, type, dan qty wajib diisi");
    }
    if (!MOVEMENT_TYPES.includes(type)) {
      return errorResponse(`type tidak valid. Pilihan: ${MOVEMENT_TYPES.join(", ")}`);
    }
    if (qty <= 0) return errorResponse("qty harus lebih dari 0");

    const { data: stock, error: stockError } = await supabase!
      .from("stock_distribution")
      .select("quantity")
      .eq("product_id", product_id)
      .eq("warehouse_id", warehouse_id)
      .single();

    const previousStock = stock?.quantity ?? 0;

    let newStock = previousStock;
    if (["adjustment_in", "transfer_in", "restock"].includes(type)) {
      newStock = previousStock + qty;
    } else if (["adjustment_out", "transfer_out", "sale"].includes(type)) {
      newStock = previousStock - qty;
      if (newStock < 0) return errorResponse("Stok tidak cukup");
    }

    if (!stockError && stock) {
      await supabase!
        .from("stock_distribution")
        .update({ quantity: newStock })
        .eq("product_id", product_id)
        .eq("warehouse_id", warehouse_id);
    } else {
      await supabase!
        .from("stock_distribution")
        .insert({ product_id, warehouse_id, quantity: newStock });
    }

    const { data, error: logError } = await supabase!
      .from("stock_movements")
      .insert({
        tenant_id:        seller!.tenant_id,
        product_id,
        warehouse_id,
        ref_warehouse_id: ref_warehouse_id ?? null,
        type,
        qty,
        previous_stock:   previousStock,
        new_stock:        newStock,
        reason:           reason         ?? null,
        performed_by:     seller!.name,
        reference_type:   reference_type ?? null,
        reference_id:     reference_id   ?? null,
      })
      .select()
      .single();

    if (logError) return errorResponse(logError.message);

    return successResponse(data, 201);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
