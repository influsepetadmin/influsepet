import { saveProfileImageFile } from "@/lib/uploads/profileImageUpload";

type ProfileImageMime = "image/jpeg" | "image/png" | "image/webp";

const PROFILE_IMAGE_GATEWAY_UPLOAD_PATH = "/profile-images";
const PROFILE_IMAGE_PUBLIC_BASE_URL = "https://media.influsepet.com/profile-images/";
const PROFILE_IMAGE_GATEWAY_TIMEOUT_MS = 15_000;

export class ProfileImageUploadConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileImageUploadConfigurationError";
  }
}

export type ProfileImageGatewayConfig =
  | { mode: "local" }
  | { mode: "gateway"; endpointUrl: string; secret: string }
  | { mode: "error"; error: string };

type ProfileImageGatewayEnv = { [key: string]: string | undefined };

function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeProfileImageGatewayUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== "https:") {
      return null;
    }
    if (url.username || url.password || url.search || url.hash) {
      return null;
    }
    if (url.hostname.toLowerCase() === "media.influsepet.com") {
      return null;
    }
    if (url.pathname !== "/" && url.pathname !== "") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getProfileImageGatewayConfig(
  env: ProfileImageGatewayEnv = process.env,
): ProfileImageGatewayConfig {
  const gatewayUrl = present(env.PROFILE_IMAGE_GATEWAY_URL);
  const secret = present(env.PROFILE_IMAGE_GATEWAY_SECRET);

  if (!gatewayUrl && !secret) {
    return { mode: "local" };
  }

  if (!gatewayUrl || !secret) {
    return {
      mode: "error",
      error: "PROFILE_IMAGE_GATEWAY_URL and PROFILE_IMAGE_GATEWAY_SECRET must be configured together.",
    };
  }

  const normalizedUrl = normalizeProfileImageGatewayUrl(gatewayUrl);
  if (!normalizedUrl) {
    return {
      mode: "error",
      error: "PROFILE_IMAGE_GATEWAY_URL must be an HTTPS Worker origin without path, query, or credentials.",
    };
  }

  return {
    mode: "gateway",
    endpointUrl: `${normalizedUrl}${PROFILE_IMAGE_GATEWAY_UPLOAD_PATH}`,
    secret,
  };
}

export function isAllowedProfileImageGatewayPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.origin !== "https://media.influsepet.com") {
      return false;
    }
    return /^\/profile-images\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp)$/i.test(
      url.pathname,
    );
  } catch {
    return false;
  }
}

async function uploadProfileImageViaGateway(
  buffer: Buffer,
  mime: ProfileImageMime,
  config: Extract<ProfileImageGatewayConfig, { mode: "gateway" }>,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_IMAGE_GATEWAY_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secret}`,
        "Content-Type": mime,
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gateway upload failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { ok?: unknown; url?: unknown };
    if (payload.ok !== true || typeof payload.url !== "string") {
      throw new Error("Gateway upload returned an invalid response");
    }
    if (!isAllowedProfileImageGatewayPublicUrl(payload.url)) {
      throw new Error("Gateway upload returned an unexpected public URL");
    }

    return payload.url;
  } finally {
    clearTimeout(timeout);
  }
}

export async function saveProfileImage(
  buffer: Buffer,
  mime: ProfileImageMime,
): Promise<string> {
  const config = getProfileImageGatewayConfig();

  if (config.mode === "local") {
    return saveProfileImageFile(buffer, mime);
  }

  if (config.mode === "error") {
    throw new ProfileImageUploadConfigurationError(config.error);
  }

  return uploadProfileImageViaGateway(buffer, mime, config);
}

export const profileImageGatewayConstants = {
  publicBaseUrl: PROFILE_IMAGE_PUBLIC_BASE_URL,
  uploadPath: PROFILE_IMAGE_GATEWAY_UPLOAD_PATH,
} as const;
