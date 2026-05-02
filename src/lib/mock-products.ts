import type { ProductRow } from "@/components/marketplace/ProductCard";
import type { FilterState } from "@/components/marketplace/Filters";

export const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "mock-1",
    name: "Blue Pottery Vase",
    description: "Hand-painted Jaipur blue pottery vase with floral motifs.",
    price: 2499,
    state: "Rajasthan",
    craft: "pottery",
    images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-2",
    name: "Banarasi Silk Stole",
    description: "Soft woven stole inspired by classic Banarasi zari patterns.",
    price: 3299,
    state: "Uttar Pradesh",
    craft: "textiles",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-3",
    name: "Terracotta Diyas Set",
    description: "Set of 12 festive terracotta diyas made by rural potters.",
    price: 699,
    state: "West Bengal",
    craft: "pottery",
    images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-4",
    name: "Dokra Brass Deer",
    description: "Lost-wax cast brass figurine from traditional Dokra craft.",
    price: 4599,
    state: "Chhattisgarh",
    craft: "metalwork",
    images: ["https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-5",
    name: "Hand-Carved Neem Box",
    description: "Intricately carved keepsake box in seasoned neem wood.",
    price: 1899,
    state: "Karnataka",
    craft: "woodwork",
    images: ["https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-6",
    name: "Kundan Drop Earrings",
    description: "Gold-toned kundan earrings with enamel work accents.",
    price: 2799,
    state: "Gujarat",
    craft: "jewelry",
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-7",
    name: "Madhubani Wall Art",
    description: "Traditional Mithila painting with natural color palette.",
    price: 5199,
    state: "Bihar",
    craft: "painting",
    images: ["https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80"],
  },
  {
    id: "mock-8",
    name: "Leather Journal Cover",
    description: "Vegetable-tanned leather cover with stitched edging.",
    price: 1499,
    state: "Tamil Nadu",
    craft: "leather",
    images: ["https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"],
  },
];

export function filterMockProducts(filters: FilterState): ProductRow[] {
  const query = filters.q.trim().toLowerCase();
  const minPrice = Number(filters.min_price);
  const maxPrice = Number(filters.max_price);

  return MOCK_PRODUCTS.filter((product) => {
    if (query && !product.name.toLowerCase().includes(query)) return false;
    if (filters.state && product.state !== filters.state) return false;
    if (filters.craft && product.craft !== filters.craft) return false;
    if (!Number.isNaN(minPrice) && filters.min_price && product.price < minPrice) return false;
    if (!Number.isNaN(maxPrice) && filters.max_price && product.price > maxPrice) return false;
    return true;
  });
}
