import { auth, getAccessToken } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }
  return session;
}

export { getAccessToken };
