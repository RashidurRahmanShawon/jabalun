// Re-exports Supabase database operations to replace WooCommerce completely
export {
  createOrder,
  getAdminProducts,
  getCategoryBySlug,
  getOrder,
  getOrders,
  getOrderStatusTotals,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getProductsByIds,
  getRelatedProducts,
  updateOrderStatus,
} from "./db";
