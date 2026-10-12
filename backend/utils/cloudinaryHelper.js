import cloudinary from "../config/cloudinary.js";

/**
 * Extracts the Cloudinary public ID (including folder prefix) from a full Cloudinary URL.
 * Handles transformed URLs, version prefixes (v123...), and audio/video resource paths.
 * 
 * Example:
 *   "https://res.cloudinary.com/demo/image/upload/v123456789/profileImages/photo_xyz.jpg"
 *   -> "profileImages/photo_xyz"
 */
export function extractPublicId(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split(/\/upload\/(?:[^\/]+\/)?/);
    if (parts.length < 2) return null;

    // Strip URL query strings if present
    const path = parts[1].split("?")[0];
    // Strip version prefix e.g. "v1712345678/"
    const withoutVersion = path.replace(/^v\d+\//, "");
    // Strip extension
    const lastDot = withoutVersion.lastIndexOf(".");
    return lastDot !== -1 ? withoutVersion.substring(0, lastDot) : withoutVersion;
  } catch (err) {
    console.error("[Cloudinary] Failed to parse public ID from URL:", url, err);
    return null;
  }
}

/**
 * Determines whether a given URL points to a video/audio asset.
 */
export function isVideoOrAudio(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("/video/upload/") ||
    /\.(m4a|mp4|mp3|aac|wav|3gp|caf|mov|webm|avi|mkv)$/i.test(url)
  );
}

/**
 * Destroys a single asset on Cloudinary given its URL or public ID.
 * Safe to fire-and-forget: logs failures without throwing unhandled exceptions.
 */
export async function destroyCloudinaryAsset(urlOrPublicId, options = {}) {
  if (!urlOrPublicId) return;

  const publicId = urlOrPublicId.includes("cloudinary.com")
    ? extractPublicId(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) return;

  const resourceType = options.resource_type || (isVideoOrAudio(urlOrPublicId) ? "video" : "image");

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
      ...options,
    });
    return res;
  } catch (err) {
    console.error(`[Cloudinary] Failed to destroy asset (${publicId}):`, err.message || err);
  }
}

/**
 * Destroys an array of Cloudinary URLs across image and video/audio types.
 * Batches calls to avoid rate limits and orphaned storage.
 */
export async function destroyCloudinaryAssets(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const validUrls = urls.filter((u) => u && typeof u === "string" && u.includes("cloudinary.com"));
  if (validUrls.length === 0) return;

  const images = [];
  const videos = [];

  for (const url of validUrls) {
    const publicId = extractPublicId(url);
    if (!publicId) continue;
    if (isVideoOrAudio(url)) {
      videos.push(publicId);
    } else {
      images.push(publicId);
    }
  }

  const tasks = [];

  // Batch delete images (Cloudinary API accepts up to 100 IDs per request)
  if (images.length > 0) {
    tasks.push(
      cloudinary.api
        .delete_resources(images, { resource_type: "image", invalidate: true })
        .catch((err) => {
          console.error("[Cloudinary] Batch image deletion error:", err.message || err);
        })
    );
  }

  // Batch delete audio/videos
  if (videos.length > 0) {
    tasks.push(
      cloudinary.api
        .delete_resources(videos, { resource_type: "video", invalidate: true })
        .catch((err) => {
          console.error("[Cloudinary] Batch video deletion error:", err.message || err);
        })
    );
  }

  await Promise.allSettled(tasks);
}
