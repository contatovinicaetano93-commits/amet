import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "professor",
  "aluno",
]);

export const users = pgTable(
  "ava_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("ava_users_email_idx").on(table.email)],
);

export const invites = pgTable(
  "ava_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("ava_invites_token_hash_idx").on(table.tokenHash)],
);

export const subjects = pgTable(
  "ava_subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("ava_subjects_slug_idx").on(table.slug)],
);

export const classes = pgTable("ava_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** manha | tarde | noite | sabado — ver src/lib/ava/shifts.ts */
  shift: text("shift"),
  teacherId: uuid("teacher_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const enrollments = pgTable(
  "ava_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ava_enrollments_class_student_idx").on(
      table.classId,
      table.studentId,
    ),
  ],
);

export const lessons = pgTable("ava_lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  storageKey: text("storage_key"),
  contentType: text("content_type"),
  sizeBytes: integer("size_bytes"),
  durationSec: integer("duration_sec"),
  published: integer("published").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const lessonProgress = pgTable(
  "ava_lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ava_lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonId,
    ),
  ],
);

export const lessonQuestions = pgTable("ava_lesson_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  askerId: uuid("asker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  answer: text("answer"),
  answeredById: uuid("answered_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  taughtClasses: many(classes),
  enrollments: many(enrollments),
  progress: many(lessonProgress),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  lessons: many(lessons),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  class: one(classes, {
    fields: [lessons.classId],
    references: [classes.id],
  }),
  progress: many(lessonProgress),
  questions: many(lessonQuestions),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, {
    fields: [lessonProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const lessonQuestionsRelations = relations(
  lessonQuestions,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonQuestions.lessonId],
      references: [lessons.id],
    }),
    asker: one(users, {
      fields: [lessonQuestions.askerId],
      references: [users.id],
    }),
    answeredBy: one(users, {
      fields: [lessonQuestions.answeredById],
      references: [users.id],
    }),
  }),
);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AvaUser = typeof users.$inferSelect;
export type AvaClass = typeof classes.$inferSelect;
export type AvaLesson = typeof lessons.$inferSelect;
export type AvaSubject = typeof subjects.$inferSelect;
export type AvaLessonQuestion = typeof lessonQuestions.$inferSelect;
