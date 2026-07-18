import { classManagePath, homePathForRole } from "@/lib/ava/navigation";
import type { UserRole } from "@/lib/ava/schema";

export type FlowStep = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  done?: boolean;
  current?: boolean;
};

export type FlowTree = {
  role: UserRole;
  title: string;
  subtitle: string;
  steps: FlowStep[];
};

export const ADMIN_FLOW_IDS = [
  "invite",
  "subject",
  "class",
  "enroll",
  "manage",
] as const;

function markCurrent(steps: FlowStep[]): FlowStep[] {
  const firstOpen = steps.findIndex((step) => !step.done);
  if (firstOpen < 0) return steps;
  return steps.map((step, index) =>
    index === firstOpen ? { ...step, current: true } : step,
  );
}

export function buildAdminFlow(stats: {
  invitedOrExtraUsers: boolean;
  subjectsCount: number;
  classesCount: number;
  enrollmentsCount: number;
  publishedLessonsCount: number;
  firstClassId?: string | null;
}): FlowTree {
  return {
    role: "admin",
    title: "Fluxo canônico — Admin",
    subtitle: "Convite → matéria → turma → matrícula → gerir aulas",
    steps: markCurrent([
      {
        id: "invite",
        title: "Convidar professor e alunos",
        detail: "O e-mail leva ao link de ativação da conta.",
        href: "#convidar",
        done: stats.invitedOrExtraUsers,
      },
      {
        id: "subject",
        title: "Criar matéria",
        detail: "Ex.: Estética facial, Imagem corporal.",
        href: "#materia",
        done: stats.subjectsCount > 0,
      },
      {
        id: "class",
        title: "Abrir turma e atribuir professor",
        detail: "Vincule a matéria e o professor responsável.",
        href: "#turma",
        done: stats.classesCount > 0,
      },
      {
        id: "enroll",
        title: "Matricular alunos",
        detail: "Só alunos matriculados veem a turma.",
        href: "#matricular",
        done: stats.enrollmentsCount > 0,
      },
      {
        id: "manage",
        title: "Gerir aulas (criar → upload → publicar)",
        detail: "Na turma, publique a primeira vídeo-aula.",
        href: stats.firstClassId
          ? classManagePath(stats.firstClassId)
          : "#turmas",
        done: stats.publishedLessonsCount > 0,
      },
    ]),
  };
}

export function buildProfessorFlow(stats: {
  classesCount: number;
  lessonsCount: number;
  publishedCount: number;
  firstClassId?: string | null;
}): FlowTree {
  const gerirHref = stats.firstClassId
    ? classManagePath(stats.firstClassId)
    : homePathForRole("professor");

  return {
    role: "professor",
    title: "Fluxo canônico — Professor",
    subtitle: "Turmas → aulas → publicar → responder dúvidas",
    steps: markCurrent([
      {
        id: "classes",
        title: "Ver turmas atribuídas",
        detail: "Só aparecem turmas em que você é o professor.",
        href: homePathForRole("professor"),
        done: stats.classesCount > 0,
      },
      {
        id: "manage",
        title: "Abrir gestão da turma",
        detail: "Criar aulas e acompanhar alunos.",
        href: gerirHref,
        done: stats.classesCount > 0 && stats.lessonsCount > 0,
      },
      {
        id: "create",
        title: "Criar vídeo-aula",
        detail: "Defina título e descrição.",
        href: gerirHref,
        done: stats.lessonsCount > 0,
      },
      {
        id: "upload",
        title: "Enviar vídeo e publicar",
        detail: "Upload no R2 e deixar a aula visível para alunos.",
        href: gerirHref,
        done: stats.publishedCount > 0,
      },
      {
        id: "doubts",
        title: "Responder dúvidas",
        detail: "Acompanhe as perguntas em aberto no painel.",
        href: homePathForRole("professor"),
        done: stats.publishedCount > 0,
      },
    ]),
  };
}

export function buildStudentFlow(stats: {
  classesCount: number;
  hasOpenClass?: boolean;
}): FlowTree {
  return {
    role: "aluno",
    title: "Fluxo canônico — Aluno",
    subtitle: "Matrícula → turma → assistir → progresso → IA",
    steps: markCurrent([
      {
        id: "enroll",
        title: "Aguardar matrícula",
        detail: "O admin precisa matricular você em uma turma.",
        done: stats.classesCount > 0,
      },
      {
        id: "class",
        title: "Abrir turma",
        detail: "Veja as vídeo-aulas publicadas.",
        href: homePathForRole("aluno"),
        done: Boolean(stats.hasOpenClass),
      },
      {
        id: "watch",
        title: "Assistir aula",
        detail: "Abra a vídeo-aula e acompanhe o conteúdo.",
        done: false,
      },
      {
        id: "progress",
        title: "Marcar conclusão",
        detail: "Registre que terminou a aula.",
        done: false,
      },
      {
        id: "ai",
        title: "Perguntar à IA da aula",
        detail: "Tire dúvidas no contexto daquele conteúdo.",
        done: false,
      },
    ]),
  };
}

export function buildClassManageFlow(stats: {
  lessonsCount: number;
  withVideoCount: number;
  publishedCount: number;
}): FlowTree {
  return {
    role: "professor",
    title: "Fluxo da turma",
    subtitle: "Criar → enviar vídeo → publicar → acompanhar",
    steps: markCurrent([
      {
        id: "create",
        title: "Criar aula",
        detail: "Use o formulário Nova vídeo-aula.",
        href: "#nova-aula",
        done: stats.lessonsCount > 0,
      },
      {
        id: "upload",
        title: "Enviar vídeo",
        detail: "Cada aula precisa do arquivo de vídeo.",
        done: stats.withVideoCount > 0,
      },
      {
        id: "publish",
        title: "Publicar",
        detail: "Só aulas publicadas aparecem para o aluno.",
        done: stats.publishedCount > 0,
      },
      {
        id: "progress",
        title: "Acompanhar progresso",
        detail: "Veja abaixo quais alunos concluíram cada aula.",
        done: stats.publishedCount > 0,
      },
    ]),
  };
}
