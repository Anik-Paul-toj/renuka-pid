import "server-only";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

function getCloudinaryCredentials() {
  let envLocalCredentials: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    cloudinaryUrl?: string;
  } = {};

  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [k, ...v] = trimmed.split("=");
          const key = k.trim();
          const val = v.join("=").trim().replace(/^["']|["']$/g, "").replace(/\r/g, "");
          if (key === "CLOUDINARY_CLOUD_NAME") envLocalCredentials.cloudName = val;
          if (key === "CLOUDINARY_API_KEY") envLocalCredentials.apiKey = val;
          if (key === "CLOUDINARY_API_SECRET") envLocalCredentials.apiSecret = val;
          if (key === "CLOUDINARY_URL") envLocalCredentials.cloudinaryUrl = val;
        }
      }
    }
  } catch {}

  // Parse CLOUDINARY_URL if available (cloudinary://key:secret@cloud_name)
  const rawUrl = envLocalCredentials.cloudinaryUrl || process.env.CLOUDINARY_URL?.trim();
  let urlKey: string | undefined;
  let urlSecret: string | undefined;
  let urlCloud: string | undefined;
  if (rawUrl && rawUrl.startsWith("cloudinary://")) {
    try {
      const parsed = new URL(rawUrl);
      urlKey = parsed.username;
      urlSecret = parsed.password;
      urlCloud = parsed.hostname;
    } catch {}
  }

  // Priority: .env.local > CLOUDINARY_URL parsed > process.env
  const cloudName =
    envLocalCredentials.cloudName ||
    urlCloud ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim();

  const apiKey =
    envLocalCredentials.apiKey ||
    urlKey ||
    process.env.CLOUDINARY_API_KEY?.trim();

  const apiSecret =
    envLocalCredentials.apiSecret ||
    urlSecret ||
    process.env.CLOUDINARY_API_SECRET?.trim();

  // Force-sync process.env so Cloudinary internals and SDK sub-modules use project credentials
  if (cloudName) process.env.CLOUDINARY_CLOUD_NAME = cloudName;
  if (apiKey) process.env.CLOUDINARY_API_KEY = apiKey;
  if (apiSecret) process.env.CLOUDINARY_API_SECRET = apiSecret;
  if (apiKey && apiSecret && cloudName) {
    process.env.CLOUDINARY_URL = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Server-only Cloudinary client configuration.
 * Never exposed to browser or client bundles.
 */
function getCloudinary() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export const CLOUDINARY_GALLERY_FOLDER = "renuka-art-studio/gallery";
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/webp",
  "image/avif",
];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image buffer directly to Cloudinary via atomic HTTPS payload.
 * Immune to writable stream chunking stalls and timeouts.
 */
export async function uploadGalleryImageBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg",
  customPublicId?: string
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const client = getCloudinary();

  const uploadOptions: Record<string, any> = {
    folder: CLOUDINARY_GALLERY_FOLDER,
    resource_type: "image",
    overwrite: true,
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  };

  if (customPublicId) {
    uploadOptions.public_id = customPublicId;
  }

  const base64Data = buffer.toString("base64");
  const dataUri = `data:${mimeType || "image/jpeg"};base64,${base64Data}`;

  try {
    const result: UploadApiResponse = await client.uploader.upload(dataUri, uploadOptions);

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    const errMsg = error?.message || error?.error?.message || "Unknown error";
    console.error("Cloudinary upload failed:", errMsg);
    throw new Error(`Cloudinary upload failed: ${errMsg}`);
  }
}

/**
 * Delete an asset from Cloudinary by its public ID.
 * Invalidate CDN cache for the asset.
 */
export async function deleteGalleryImageByPublicId(publicId: string): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const client = getCloudinary();

  try {
    const result = await client.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    } as any);
    return result.result === "ok" || result.result === "not found";
  } catch (error: any) {
    console.error("Cloudinary delete error:", error?.message || error);
    return false;
  }
}

/**
 * Generate a transformed, CDN-optimized Cloudinary image URL.
 * Automatically injects `f_auto,q_auto` and requested sizing parameters.
 */
export function getOptimizedCloudinaryUrl(
  urlOrPublicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    crop?: "fill" | "limit" | "scale" | "thumb";
  }
): string {
  if (!urlOrPublicId) return "";

  // If already a Cloudinary secure URL, insert transformation parameters
  if (urlOrPublicId.includes("cloudinary.com") && urlOrPublicId.includes("/upload/")) {
    const parts = urlOrPublicId.split("/upload/");
    const transforms: string[] = ["f_auto", "q_auto"];

    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);

    return `${parts[0]}/upload/${transforms.join(",")}/${parts[1]}`;
  }

  // If public ID only, construct using Cloudinary client
  try {
    const client = getCloudinary();
    return client.url(urlOrPublicId, {
      secure: true,
      fetch_format: "auto",
      quality: options?.quality || "auto",
      width: options?.width,
      height: options?.height,
      crop: options?.crop || "limit",
    });
  } catch {
    return urlOrPublicId;
  }
}
