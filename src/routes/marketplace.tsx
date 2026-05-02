import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type ProductRow } from "@/components/marketplace/ProductCard";
import { Filters, emptyFilters, type FilterState } from "@/components/marketplace/Filters";
import { AIChatbot } from "@/components/marketplace/AIChatbot";
import { Loader2, PackageOpen, Share2 } from "lucide-react";
import { filterMockProducts } from "@/lib/mock-products";
import { disableMockDataMode, enableMockDataMode, isSchemaMissingError, shouldUseMockData } from "@/lib/data-mode";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/image-url";
import { getProductBadge, getProductSpecs, getProductType } from "@/lib/product-info";

export const Route = createFileRoute("/marketplace")({
  component: Marketplace,
  head: () => ({
    meta: [
      { title: "Marketplace — Karigari" },
      { name: "description", content: "Browse handmade goods from Indian artisans by craft, state, and price." },
    ],
  }),
});

function Marketplace() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ProductRow | null>(null);
  const previewSpecs = preview ? getProductSpecs(preview) : null;

  // Debounce
  const debouncedFilters = useDebounced(filters, 300);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (shouldUseMockData()) {
        if (!cancelled) {
          setProducts(filterMockProducts(debouncedFilters));
          setLoading(false);
        }
        return;
      }
      let q = supabase.from("products").select("id,name,description,price,state,craft,images")
        .eq("is_published", true).order("created_at", { ascending: false }).limit(60);
      if (debouncedFilters.q) q = q.ilike("name", `%${debouncedFilters.q}%`);
      if (debouncedFilters.state) q = q.eq("state", debouncedFilters.state);
      if (debouncedFilters.craft) q = q.eq("craft", debouncedFilters.craft as any);
      const minP = Number(debouncedFilters.min_price);
      const maxP = Number(debouncedFilters.max_price);
      if (!Number.isNaN(minP) && debouncedFilters.min_price) q = q.gte("price", minP);
      if (!Number.isNaN(maxP) && debouncedFilters.max_price) q = q.lte("price", maxP);
      const { data, error } = await q;
      if (!error) disableMockDataMode();
      if (isSchemaMissingError(error)) enableMockDataMode();
      const resolvedProducts = !error && data && data.length > 0
        ? (data as ProductRow[])
        : filterMockProducts(debouncedFilters);
      if (!cancelled) {
        setProducts(resolvedProducts);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedFilters]);

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main">
        <div className="mb-8">
          <h1 className="section-title">Marketplace</h1>
          <p className="section-subtitle">Handmade goods, direct from the maker.</p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
          <aside className="space-y-6">
            <AIChatbot onApply={(f) => setFilters(f)} />
            <div className="surface-card p-5">
              <Filters value={filters} onChange={setFilters} />
            </div>
          </aside>

          <section className="surface-card p-5 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <PackageOpen className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <p className="font-display text-lg">No pieces match those filters yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Try widening your search.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Showing {products.length} product{products.length === 1 ? "" : "s"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((p) => <ProductCard key={p.id} p={p} onPreview={setPreview} />)}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        {preview && (
          <DialogContent className="w-[92vw] max-w-[920px] p-0 overflow-hidden rounded-[28px] border border-border/40 shadow-2xl">
            <DialogTitle className="sr-only">{preview.name}</DialogTitle>
            <DialogDescription className="sr-only">{preview.description}</DialogDescription>
            <div className="grid bg-background md:h-[600px] md:grid-cols-[1fr_1fr]">
              <div className="bg-muted/60">
                {preview.images?.[0] ? (
                  <img
                    src={normalizeImageUrl(preview.images[0])}
                    alt={preview.name}
                    className="h-full w-full object-cover min-h-[220px]"
                  />
                ) : (
                  <div className="flex h-full min-h-[220px] items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col p-4 md:p-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                    {preview.craft}
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl leading-tight font-medium">{preview.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Type: <span className="font-medium text-foreground/80">{getProductType(preview)}</span>
                  </p>
                  <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
                    {getProductBadge(preview)}
                  </span>
                  <p className="text-xl md:text-2xl font-semibold text-primary leading-none">
                    ₹{Number(preview.price).toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm md:text-base leading-relaxed text-foreground/80 line-clamp-6 md:line-clamp-7">
                    {preview.description}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-secondary/35 p-3 space-y-1.5">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide">Product Specifications</h3>
                  <p className="text-xs md:text-sm"><span className="font-semibold">Material:</span> {previewSpecs?.material}</p>
                  <p className="text-xs md:text-sm"><span className="font-semibold">Features:</span> {previewSpecs?.features}</p>
                  <p className="text-xs md:text-sm"><span className="font-semibold">Dimensions:</span> {previewSpecs?.dimensions}</p>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                  <div className="flex items-end justify-between text-xs text-muted-foreground">
                    <div />
                    <div className="text-right">
                      <p>Category: {preview.craft}</p>
                      <p>Type: {getProductType(preview)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-4 h-9 min-w-28 text-sm">
                      <Link to="/checkout" search={{ productId: preview.id, qty: 1 }} onClick={() => setPreview(null)}>
                        Enquire Now
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-4 h-9 min-w-24 text-sm">
                      <Link to="/product/$id" params={{ id: preview.id }} onClick={() => setPreview(null)}>
                        <span className="inline-flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function useDebounced<T>(v: T, ms: number): T {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}
