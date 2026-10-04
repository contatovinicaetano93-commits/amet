export function isNativeScrollRoute(pathname: string) {
  return pathname === "/estagios" || pathname.startsWith("/estagios/") || pathname === "/admin";
}
