import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return payload;
}

export async function requireRole(allowedRoles) {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user,
      error: NextResponse.json(
        {
          error: `Access denied. This action requires role: ${allowedRoles.join(
            " or ",
          )}.`,
        },
        { status: 403 },
      ),
    };
  }

  return { user, error: null };
}
