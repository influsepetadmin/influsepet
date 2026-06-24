import { normalizeProfileImageGatewayUrl } from "@/lib/uploads/profileImageGateway";
import { isValidDeliveryMediaObjectKey } from "@/lib/uploads/privateDeliveryMedia";

type PrivateDeliveryMediaGatewayEnv = { [key: string]: string | undefined };

export type PrivateDeliveryMediaStorageConfig =
  | { mode: "local" }
  | { mode: "r2"; origin: string; gatewaySecret: string; ticketSecret: string }
  | { mode: "error"; code: "DELIVERY_R2_CONFIG_INVALID"; error: string };

export type PrivateDeliveryMediaGatewayConfig =
  | { mode: "configured"; origin: string; secret: string }
  | { mode: "disabled"; reason: "MISSING" | "PARTIAL" | "INVALID_URL" };

export type PrivateDeliveryMediaObjectMetadata = {
  objectKey: string;
  contentType: string | null;
  contentLength: number | null;
  etag: string | null;
  privateMediaScope: string | null;
};

function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getPrivateDeliveryMediaStorageConfig(
  env: PrivateDeliveryMediaGatewayEnv = process.env,
): PrivateDeliveryMediaStorageConfig {
  const ticketSecret = present(env.PRIVATE_MEDIA_TICKET_SECRET);
  const gatewayUrl = present(env.PROFILE_IMAGE_GATEWAY_URL);
  const gatewaySecret = present(env.PROFILE_IMAGE_GATEWAY_SECRET);

  if (!ticketSecret) {
    return { mode: "local" };
  }

  if (!gatewayUrl || !gatewaySecret) {
    return {
      mode: "error",
      code: "DELIVERY_R2_CONFIG_INVALID",
      error: "Delivery media R2 gateway configuration is incomplete.",
    };
  }

  const origin = normalizeProfileImageGatewayUrl(gatewayUrl);
  if (!origin) {
    return {
      mode: "error",
      code: "DELIVERY_R2_CONFIG_INVALID",
      error: "Delivery media R2 gateway URL is invalid.",
    };
  }

  return { mode: "r2", origin, gatewaySecret, ticketSecret };
}

export function getPrivateDeliveryMediaGatewayConfig(
  env: PrivateDeliveryMediaGatewayEnv = process.env,
): PrivateDeliveryMediaGatewayConfig {
  const url = present(env.PROFILE_IMAGE_GATEWAY_URL);
  const secret = present(env.PROFILE_IMAGE_GATEWAY_SECRET);
  if (!url && !secret) {
    return { mode: "disabled", reason: "MISSING" };
  }
  if (!url || !secret) {
    return { mode: "disabled", reason: "PARTIAL" };
  }

  const origin = normalizeProfileImageGatewayUrl(url);
  if (!origin) {
    return { mode: "disabled", reason: "INVALID_URL" };
  }

  return { mode: "configured", origin, secret };
}

export function privateDeliveryMediaObjectUrl(origin: string, objectKey: string): string {
  if (!isValidDeliveryMediaObjectKey(objectKey)) {
    throw new Error("Invalid delivery media object key");
  }
  const filename = objectKey.slice("delivery-media/".length);
  return `${origin}/delivery-media/${encodeURIComponent(filename)}`;
}

function authHeaders(secret: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${secret}`);
  return headers;
}

export async function headPrivateDeliveryMediaObject(
  objectKey: string,
  config = getPrivateDeliveryMediaGatewayConfig(),
): Promise<PrivateDeliveryMediaObjectMetadata> {
  if (config.mode !== "configured") {
    throw new Error("Private delivery media gateway is not configured");
  }
  const response = await fetch(privateDeliveryMediaObjectUrl(config.origin, objectKey), {
    method: "HEAD",
    headers: authHeaders(config.secret),
  });
  if (!response.ok) {
    throw new Error(`Private delivery media HEAD failed with status ${response.status}`);
  }

  const length = response.headers.get("content-length");
  return {
    objectKey,
    contentType: response.headers.get("content-type"),
    contentLength: length ? Number(length) : null,
    etag: response.headers.get("etag"),
    privateMediaScope: response.headers.get("x-influsepet-private-media-scope"),
  };
}

export async function getPrivateDeliveryMediaObjectResponse(
  objectKey: string,
  rangeHeader?: string | null,
  config = getPrivateDeliveryMediaGatewayConfig(),
): Promise<Response> {
  if (config.mode !== "configured") {
    throw new Error("Private delivery media gateway is not configured");
  }
  const headers = authHeaders(config.secret);
  if (rangeHeader) {
    headers.set("Range", rangeHeader);
  }
  const response = await fetch(privateDeliveryMediaObjectUrl(config.origin, objectKey), {
    method: "GET",
    headers,
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`Private delivery media GET failed with status ${response.status}`);
  }
  return response;
}

export async function deletePrivateDeliveryMediaObject(
  objectKey: string,
  config = getPrivateDeliveryMediaGatewayConfig(),
): Promise<void> {
  if (config.mode !== "configured") {
    throw new Error("Private delivery media gateway is not configured");
  }
  const response = await fetch(privateDeliveryMediaObjectUrl(config.origin, objectKey), {
    method: "DELETE",
    headers: authHeaders(config.secret),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Private delivery media DELETE failed with status ${response.status}`);
  }
}
