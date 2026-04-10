export function getUserId(req?: Request) {
  // 1. header
  const headerId = req?.headers.get("x-user-id");
  if (headerId) return headerId;

  // 2. env fallback
  return process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user";
}
