// Customer statuses the admin can set (shared by server pages and client forms)
export const CUSTOMER_STATUSES = {
  regular: { label: "সাধারণ", tone: "neutral" },
  vip: { label: "VIP", tone: "green" },
  followup: { label: "ফলো-আপ দরকার", tone: "amber" },
  blocked: { label: "ব্লক / ভুয়া অর্ডার", tone: "red" },
};

export function customerStatusInfo(status) {
  return CUSTOMER_STATUSES[status] ?? CUSTOMER_STATUSES.regular;
}
