import { z } from "zod";

import { shiftCodes } from "@/lib/ava/shifts";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES } from "@/lib/ava/storage";

export const shiftCodeSchema = z.enum(shiftCodes);

export const userRoleSchema = z.enum(["admin", "professor", "aluno"]);

export const loginSchema = z.object({
  email: z.email("E-mail inválido").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(128),
});

export const inviteCreateSchema = z.object({
  email: z.email("E-mail inválido").transform((v) => v.trim().toLowerCase()),
  role: userRoleSchema,
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(200),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128),
});

export const subjectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const classCreateSchema = z.object({
  subjectId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  shift: shiftCodeSchema,
  teacherId: z.uuid().nullable().optional(),
});

export const classUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  shift: shiftCodeSchema.optional(),
  teacherId: z.uuid().nullable().optional(),
});

export const enrollmentCreateSchema = z.object({
  classId: z.uuid(),
  studentId: z.uuid(),
});

export const lessonCreateSchema = z.object({
  classId: z.uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  order: z.number().int().min(0).max(10_000).optional(),
});

export const lessonUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  published: z.boolean().optional(),
});

export const uploadIntentSchema = z.object({
  lessonId: z.uuid(),
  contentType: z.enum(ALLOWED_VIDEO_TYPES),
  contentLength: z
    .number()
    .int()
    .positive()
    .max(MAX_VIDEO_BYTES, "Arquivo excede o limite configurado."),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export const progressSchema = z.object({
  lessonId: z.uuid(),
  completed: z.boolean(),
});

export const lessonQuestionCreateSchema = z.object({
  body: z.string().trim().min(3).max(2000),
});

export const lessonQuestionAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});
