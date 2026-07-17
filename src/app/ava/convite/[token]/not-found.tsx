import Link from "next/link";

export default function InviteNotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-amet-indigo">
        Convite inválido
      </h1>
      <p className="text-amet-indigo/70">
        Este link expirou, já foi usado ou não existe. Peça um novo convite ao
        administrador.
      </p>
      <Link
        href="/ava/login"
        className="inline-flex rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white"
      >
        Ir para o login
      </Link>
    </div>
  );
}
