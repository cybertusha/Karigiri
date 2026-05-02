import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CRAFT_TYPES } from "@/lib/constants";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { disableMockDataMode, enableMockDataMode, isSchemaMissingError, shouldUseMockData } from "@/lib/data-mode";
import { normalizeImageUrl } from "@/lib/image-url";
import { getProductBadge, getProductSpecs, getProductType } from "@/lib/product-info";
import { toast } from "sonner";

interface ProductFull {
  id: string;
  artisan_id: string;
  name: string;
  description: string;
  price: number;
  state: string;
  craft: string;
  images: string[];
  profiles: { display_name: string } | null;
}

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="font-display text-2xl">Product not found</p>
        <Link to="/marketplace" className="text-primary hover:underline mt-2 inline-block">
          Back to marketplace
        </Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const [p, setP] = useState<ProductFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (shouldUseMockData()) {
      const mock = MOCK_PRODUCTS.find((item) => item.id === id);
      setP(
        mock
          ? ({
              ...mock,
              artisan_id: "mock-artisan",
              profiles: { display_name: "Demo artisan" },
            } as ProductFull)
          : null,
      );
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,artisan_id,name,description,price,state,craft,images")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        disableMockDataMode();
        let displayName: string | null = null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", data.artisan_id)
          .maybeSingle();
        displayName = profile?.display_name ?? null;

        setP({
          ...(data as Omit<ProductFull, "profiles">),
          profiles: displayName ? { display_name: displayName } : null,
        });
        setLoading(false);
        return;
      }

      if (isSchemaMissingError(error)) enableMockDataMode();
      const mock = MOCK_PRODUCTS.find((item) => item.id === id);
      setP(
        mock
          ? ({
              ...mock,
              artisan_id: "mock-artisan",
              profiles: { display_name: "Demo artisan" },
            } as ProductFull)
          : null,
      );
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!p) throw notFound();

  const craftLabel = CRAFT_TYPES.find((c) => c.value === p.craft)?.label ?? p.craft;
  const img = normalizeImageUrl(p.images?.[activeImg]);
  const badge = getProductBadge(p);
  const type = getProductType(p);
  const specs = getProductSpecs(p);

  const shareProduct = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: p.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied");
      }
    } catch {
      // User cancelled share, no action needed.
    }
  };

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to marketplace
        </Link>
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 surface-card p-5 md:p-6">
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground/50 italic font-display">No image</div>}
            </div>
            {p.images.length > 1 && (
              <div className="flex gap-2">
                {p.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={normalizeImageUrl(src)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-5 md:pr-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase mb-1">{craftLabel}</p>
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">{p.name}</h1>
              <p className="text-base text-muted-foreground mt-1">Type: <span className="font-medium text-foreground/80">{type}</span></p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-primary">{badge}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.state}</span>
              </div>
              {p.profiles && <p className="text-sm text-muted-foreground mt-2">by {p.profiles.display_name}</p>}
            </div>
            <p className="text-3xl font-medium text-primary">₹{Number(p.price).toLocaleString("en-IN")}</p>
            <p className="text-lg leading-relaxed text-foreground/85">{p.description}</p>
            <div className="surface-panel bg-secondary/30 p-4 space-y-2">
              <h3 className="font-display text-xl font-medium">Product Specifications</h3>
              <p className="text-sm"><span className="font-semibold">Material:</span> {specs.material}</p>
              <p className="text-sm"><span className="font-semibold">Features:</span> {specs.features}</p>
              <p className="text-sm"><span className="font-semibold">Dimensions:</span> {specs.dimensions}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Category: {craftLabel}</p>
              <p>Type: {type}</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button asChild className="bg-primary hover:bg-primary/90 min-w-36">
                <Link to="/checkout" search={{ productId: p.id, qty: 1 }}>Buy now</Link>
              </Button>
              <Button variant="outline" className="min-w-28" onClick={shareProduct}>
                Share
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
