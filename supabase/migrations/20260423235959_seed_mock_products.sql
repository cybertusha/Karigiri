-- Seed demo products into your connected Supabase project.
-- Requires at least one artisan user in public.user_roles.

WITH artisan AS (
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'artisan'
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO public.products (artisan_id, name, description, price, state, craft, images, is_published)
SELECT
  artisan.user_id,
  seeded.name,
  seeded.description,
  seeded.price::numeric,
  seeded.state,
  seeded.craft::public.craft_type,
  seeded.images::text[],
  true
FROM artisan
CROSS JOIN (
  VALUES
    ('Blue Pottery Vase', 'Hand-painted Jaipur blue pottery vase with floral motifs.', 2499, 'Rajasthan', 'pottery', ARRAY['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80']),
    ('Banarasi Silk Stole', 'Soft woven stole inspired by classic Banarasi zari patterns.', 3299, 'Uttar Pradesh', 'textiles', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80']),
    ('Terracotta Diyas Set', 'Set of 12 festive terracotta diyas made by rural potters.', 699, 'West Bengal', 'pottery', ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80']),
    ('Dokra Brass Deer', 'Lost-wax cast brass figurine from traditional Dokra craft.', 4599, 'Chhattisgarh', 'metalwork', ARRAY['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80']),
    ('Hand-Carved Neem Box', 'Intricately carved keepsake box in seasoned neem wood.', 1899, 'Karnataka', 'woodwork', ARRAY['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80']),
    ('Kundan Drop Earrings', 'Gold-toned kundan earrings with enamel work accents.', 2799, 'Gujarat', 'jewelry', ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80']),
    ('Madhubani Wall Art', 'Traditional Mithila painting with natural color palette.', 5199, 'Bihar', 'painting', ARRAY['https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80']),
    ('Leather Journal Cover', 'Vegetable-tanned leather cover with stitched edging.', 1499, 'Tamil Nadu', 'leather', ARRAY['https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80'])
) AS seeded(name, description, price, state, craft, images)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.name = seeded.name
    AND p.artisan_id = artisan.user_id
);
