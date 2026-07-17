CREATE TYPE "public"."user_role" AS ENUM('admin', 'professor', 'aluno');--> statement-breakpoint
CREATE TABLE "ava_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" text NOT NULL,
	"teacher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"storage_key" text,
	"content_type" text,
	"size_bytes" integer,
	"duration_sec" integer,
	"published" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ava_lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ava_invites" ADD CONSTRAINT "ava_invites_created_by_ava_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."ava_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_classes" ADD CONSTRAINT "ava_classes_subject_id_ava_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."ava_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_classes" ADD CONSTRAINT "ava_classes_teacher_id_ava_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."ava_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_enrollments" ADD CONSTRAINT "ava_enrollments_class_id_ava_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."ava_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_enrollments" ADD CONSTRAINT "ava_enrollments_student_id_ava_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."ava_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_lessons" ADD CONSTRAINT "ava_lessons_class_id_ava_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."ava_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_lesson_progress" ADD CONSTRAINT "ava_lesson_progress_user_id_ava_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ava_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ava_lesson_progress" ADD CONSTRAINT "ava_lesson_progress_lesson_id_ava_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."ava_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ava_users_email_idx" ON "ava_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "ava_invites_token_hash_idx" ON "ava_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "ava_subjects_slug_idx" ON "ava_subjects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ava_enrollments_class_student_idx" ON "ava_enrollments" USING btree ("class_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ava_lesson_progress_user_lesson_idx" ON "ava_lesson_progress" USING btree ("user_id","lesson_id");
