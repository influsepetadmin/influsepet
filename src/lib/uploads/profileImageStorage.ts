import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  extensionForMime,
  saveProfileImageFile,
  type ProfileImageMime,
} from "@/lib/uploads/profileImageUpload";

const R2_ENV_KEYS = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
] as const;

const PROFILE_IMAGE_OBJECT_PREFIX = "profile-images";
const PROFILE_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

type R2EnvKey = (typeof R2_ENV_KEYS)[number];
type EnvLike = Readonly<Record<string, string | undefined>>;

export type ProfileImageStorageConfig =
  | { mode: "local" }
  | {
      mode: "r2";
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      publicBaseUrl: string;
    };

export class ProfileImageStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileImageStorageConfigError";
  }
}

function normalizeHttpBaseUrl(value: string, envName: string): string {
  const normalized = value.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new ProfileImageStorageConfigError(`${envName} must be a valid HTTP(S) URL.`);
  }
  return normalized;
}

export function resolveProfileImageStorageConfig(
  env: EnvLike = process.env,
): ProfileImageStorageConfig {
  const values = Object.fromEntries(
    R2_ENV_KEYS.map((key) => [key, env[key]?.trim() ?? ""]),
  ) as Record<R2EnvKey, string>;
  const configuredKeys = R2_ENV_KEYS.filter((key) => Boolean(values[key]));

  if (configuredKeys.length === 0) return { mode: "local" };

  if (configuredKeys.length !== R2_ENV_KEYS.length) {
    const missing = R2_ENV_KEYS.filter((key) => !values[key]);
    throw new ProfileImageStorageConfigError(
      `R2 profile image storage is partially configured. Missing: ${missing.join(", ")}.`,
    );
  }

  return {
    mode: "r2",
    endpoint: normalizeHttpBaseUrl(values.R2_ENDPOINT, "R2_ENDPOINT"),
    accessKeyId: values.R2_ACCESS_KEY_ID,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY,
    bucket: values.R2_BUCKET,
    publicBaseUrl: normalizeHttpBaseUrl(values.R2_PUBLIC_BASE_URL, "R2_PUBLIC_BASE_URL"),
  };
}

export function buildProfileImageObjectKey(
  mime: ProfileImageMime,
  id: string = randomUUID(),
): string {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    throw new Error("Profile image object id must be a UUID.");
  }
  return `${PROFILE_IMAGE_OBJECT_PREFIX}/${id}.${extensionForMime(mime)}`;
}

export function buildR2ProfileImageUrl(publicBaseUrl: string, objectKey: string): string {
  const base = normalizeHttpBaseUrl(publicBaseUrl, "R2_PUBLIC_BASE_URL");
  return `${base}/${objectKey}`;
}

export async function storeProfileImage(
  buffer: Buffer,
  mime: ProfileImageMime,
): Promise<string> {
  const config = resolveProfileImageStorageConfig();
  if (config.mode === "local") {
    return saveProfileImageFile(buffer, mime);
  }

  const objectKey = buildProfileImageObjectKey(mime);
  const client = new S3Client({
    endpoint: config.endpoint,
    region: "auto",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: mime,
      CacheControl: PROFILE_IMAGE_CACHE_CONTROL,
    }),
  );

  return buildR2ProfileImageUrl(config.publicBaseUrl, objectKey);
}
