export function normalizeImageUrl(url?: string | null) {
  if (!url) return "";

  // Keep local previews and non-storage URLs unchanged.
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  // Normalize legacy Supabase storage URLs missing "/public/" segment.
  // Handles relative and absolute URLs.
  if (url.includes("/storage/v1/object/product-images/")) {
    return url.replace("/storage/v1/object/product-images/", "/storage/v1/object/public/product-images/");
  }

  if (url.includes("/storage/v1/object/") && !url.includes("/storage/v1/object/public/")) {
    return url.replace("/storage/v1/object/", "/storage/v1/object/public/");
  }

  return url;
}
