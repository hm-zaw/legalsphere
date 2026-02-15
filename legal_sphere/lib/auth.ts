import { NextRequest, NextResponse } from "next/server";

export function getUserFromRequest(request: NextRequest) {
  const userDataCookie = request.cookies.get("userData");
  const tokenCookie = request.cookies.get("userToken");

  if (!tokenCookie) {
    return null;
  }

  let parsedUser = null;
  try {
    if (userDataCookie) {
      parsedUser = JSON.parse(decodeURIComponent(userDataCookie.value));
    }
  } catch (error) {
    console.error("Error parsing user data cookie:", error);
  }

  return {
    user: parsedUser, // may be null
    role: parsedUser?.role ?? null,
    token: tokenCookie.value,
  };
}

export function getRedirectUrl(role: string | null): string {
  switch (role) {
    case "admin":
      return "/admin-dashboard";
    case "lawyer":
      return "/lawyer-dashboard";
    case "client":
    case "user":
      return "/dashboard";
    default:
      return "/login";
  }
}

export function checkRouteAccess(
  pathname: string,
  userRole: string | null,
): boolean {
  const publicRoutes = ["/login", "/signup", "/"];

  // If it's a public route, allow access
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // If no user role, deny access
  if (!userRole) {
    return false;
  }

  // Role-based route protection
  const adminRoutes = ["/admin-dashboard"];
  const lawyerRoutes = ["/lawyer-dashboard"];
  const clientRoutes = ["/dashboard"];

  // Check if user is trying to access a route they don't have permission for
  if (
    adminRoutes.some((route) => pathname.startsWith(route)) &&
    userRole !== "admin"
  ) {
    return false;
  }

  if (
    lawyerRoutes.some((route) => pathname.startsWith(route)) &&
    userRole !== "lawyer"
  ) {
    return false;
  }

  if (
    clientRoutes.some((route) => pathname.startsWith(route)) &&
    userRole !== "client" &&
    userRole !== "user"
  ) {
    return false;
  }

  return true;
}
