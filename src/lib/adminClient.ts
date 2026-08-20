export const ADMIN_STORAGE_KEY = "amet-admin-key";

export function adminHeaders(key: string, json = true): HeadersInit {
  return json
    ? { "x-admin-key": key, "Content-Type": "application/json" }
    : { "x-admin-key": key };
}

export async function readAdminError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
