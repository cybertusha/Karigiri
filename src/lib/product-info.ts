import type { ProductRow } from "@/components/marketplace/ProductCard";

const TAGS = [
  { key: "eco", label: "Eco-Friendly" },
  { key: "durable", label: "Durable" },
  { key: "soft", label: "Soft Touch" },
  { key: "premium", label: "Premium Quality" },
  { key: "handmade", label: "Handmade" },
  { key: "absorb", label: "Extra-Absorbent" },
  { key: "skin", label: "Skin-Friendly" },
];

export function getProductBadge(product: Pick<ProductRow, "description" | "name">) {
  const text = `${product.name} ${product.description}`.toLowerCase();
  const match = TAGS.find((t) => text.includes(t.key));
  return match?.label ?? "Best Seller";
}

export function getProductType(product: Pick<ProductRow, "name" | "craft">) {
  const name = product.name.trim();
  if (!name) return "Handcrafted Item";
  if (name.split(" ").length <= 2) return name;
  return `${name.split(" ").slice(0, 2).join(" ")} Item`;
}

export function getShortDescription(description: string, maxLength = 120) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

export function getProductSpecs(product: Pick<ProductRow, "craft" | "description">) {
  const lower = product.description.toLowerCase();

  let material = "Natural artisan materials";
  if (lower.includes("cotton")) material = "Cotton";
  else if (lower.includes("silk")) material = "Silk";
  else if (lower.includes("clay") || lower.includes("terracotta")) material = "Clay / Terracotta";
  else if (lower.includes("wood")) material = "Solid wood";
  else if (lower.includes("leather")) material = "Genuine leather";
  else if (lower.includes("brass") || lower.includes("metal")) material = "Brass / Metal";

  const features = [
    "Handcrafted",
    "Artisan-made",
    product.craft.charAt(0).toUpperCase() + product.craft.slice(1),
  ].join(", ");

  const dimensionMatch =
    product.description.match(/\b\d+\s?[x×]\s?\d+\s?(cm|in|inch|inches)?\b/i) ??
    product.description.match(/\b\d+\s?(cm|in|inch|inches)\b/i);
  const dimensions = dimensionMatch?.[0] ?? "Standard handcrafted size";

  return { material, features, dimensions };
}
