export function getAuthUser() {
  // placeholder for Supabase Auth integration
  return {
    id: process.env.NEXT_PUBLIC_DEMO_USER_ID || "demo-user",
    role: "user"
  };
}
