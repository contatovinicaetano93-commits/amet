import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export type AllowedVideoType = (typeof ALLOWED_VIDEO_TYPES)[number];

export const MAX_VIDEO_BYTES = Number(
  process.env.AVA_MAX_VIDEO_BYTES ?? 2 * 1024 * 1024 * 1024,
);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada.`);
  }
  return value;
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
  if (params.contentLength <= 0 || params.contentLength > MAX_VIDEO_BYTES) {
    throw new Error("Tamanho de arquivo inválido.");
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: params.storageKey,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 30 });
}

export async function createReadUrl(storageKey: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: storageKey,
  });
  return getSignedUrl(client, command, { expiresIn: 60 * 60 });
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
