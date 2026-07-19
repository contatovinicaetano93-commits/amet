import participantesData from "../../data/participantes.json";

import { stripDigits } from "@/lib/validators";

type ParticipantesFile = {
  cpfs: string[];
};

function loadCpfSet(): Set<string> {
  const parsed = participantesData as ParticipantesFile | string[];
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.cpfs)
      ? parsed.cpfs
      : [];
  return new Set(list.map((cpf) => stripDigits(String(cpf))));
}

const CPF_SET = loadCpfSet();

export function isParticipanteCpf(cpf: string): boolean {
  return CPF_SET.has(stripDigits(cpf));
}
