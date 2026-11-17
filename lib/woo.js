// Re-exports Supabase database operations to replace WooCommerce completely
export {
  createOrder,
  deleteOrders,
  getAdminProducts,
  getCategories,
  getCategoryBySlug,
  getOrder,
  getOrders,
  getOrderStatsRows,
  getOrderStatusTotals,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getProductsByIds,
  getRelatedProducts,
  updateOrderStatus,
} from "./db";
