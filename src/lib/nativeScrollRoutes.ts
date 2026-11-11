export function isNativeScrollRoute(pathname: string) {
  return pathname === "/estagios" || pathname.startsWith("/estagios/") || pathname === "/admin" || pathname.startsWith("/admin/");
}
