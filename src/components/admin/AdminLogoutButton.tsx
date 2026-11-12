"use client";

export function AdminLogoutButton() {
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-amet-purple/20 px-4 py-2 text-sm font-medium text-amet-purple hover:bg-amet-purple/5"
    >
      Sair
    </button>
  );
}
