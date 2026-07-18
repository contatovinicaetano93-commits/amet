import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export type AllowedVideoType = (typeof ALLOWED_VIDEO_TYPES)[number];

export const MAX_VIDEO_BYTES = Number(
  process.env.AVA_MAX_VIDEO_BYTES ?? 2 * 1024 * 1024 * 1024,
);

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada.`);
  }
  return value;
}

export function isR2Configured(): boolean {
  return R2_ENV_KEYS.every((key) => Boolean(process.env[key]));
}

export function missingR2EnvKeys(): string[] {
  return R2_ENV_KEYS.filter((key) => !process.env[key]);
}

function getR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function getBucket() {
  return requireEnv("R2_BUCKET_NAME");
}

export function isAllowedVideoType(type: string): type is AllowedVideoType {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type);
}

export function buildLessonStorageKey(
  classId: string,
  lessonId: string,
  extension: string,
): string {
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp4";
  return `lessons/${classId}/${lessonId}.${safeExt}`;
}

export async function createUploadUrl(params: {
  storageKey: string;
  contentType: AllowedVideoType;
  contentLength: number;
}): Promise<string> {
  if (!isR2Configured()) {
    throw new Error(
      `Storage R2 incompleto. Faltam: ${missingR2EnvKeys().join(", ")}`,
    );
  }
  if (params.contentLength <= 0 || params.contentLength > MAX_VIDEO_BYTES) {
    throw new Error("Tamanho de arquivo inválido.");
  }

  const client = getR2Client();
  // Avoid signing ContentLength — Safari/browser PUTs are more reliable this way.
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: params.storageKey,
    ContentType: params.contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 30 });
}

export async function objectExists(storageKey: string): Promise<boolean> {
  if (!isR2Configured()) return false;
  try {
    const client = getR2Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: storageKey,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function createReadUrl(storageKey: string): Promise<string> {
  if (!isR2Configured()) {
    throw new Error(
      `Storage R2 incompleto. Faltam: ${missingR2EnvKeys().join(", ")}`,
    );
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: storageKey,
  });
  return getSignedUrl(client, command, { expiresIn: 60 * 60 });
}

/** Verifica se as credenciais conseguem acessar o bucket (best-effort). */
export async function probeR2Bucket(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!isR2Configured()) {
    return {
      ok: false,
      error: `Faltam envs: ${missingR2EnvKeys().join(", ")}`,
    };
  }

  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: getBucket() }));
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao acessar o bucket R2";
    return { ok: false, error: message };
  }
}

export function extensionForContentType(contentType: AllowedVideoType): string {
  switch (contentType) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default: {
      const _exhaustive: never = contentType;
      return String(_exhaustive);
    }
  }
}
