import { isParticipanteCpf as isParticipanteCpfInDb } from "@/lib/db";

/** Verifica se o CPF está na base de alunos (Postgres). */
export async function isParticipanteCpf(cpf: string): Promise<boolean> {
  return isParticipanteCpfInDb(cpf);
}
