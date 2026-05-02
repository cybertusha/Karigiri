import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { shouldUseMockData } from "@/lib/data-mode";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { normalizeImageUrl } from "@/lib/image-url";
import { toast } from "sonner";

interface ProductLite {
  id: string;
  name: string;
  price: number;
  images: string[];
  state: string;
  craft: string;
}

const LAST_PRODUCT_KEY = "karigari:last-product-id";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => ({
    productId: typeof s.productId === "string" ? s.productId : "",
    qty: typeof s.qty === "number" && s.qty > 0 ? Math.floor(s.qty) : 1,
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { productId, qty } = Route.useSearch();

  const [product, setProduct] = useState<ProductLite | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(Math.max(1, qty));

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to continue checkout.");
      const redirect = `/checkout?productId=${encodeURIComponent(productId)}&qty=${quantity}`;
      navigate({ to: "/auth", search: { mode: "signin", redirect } });
    }
  }, [authLoading, user, navigate, productId, quantity]);

  useEffect(() => {
    const resolvedProductId = productId || localStorage.getItem(LAST_PRODUCT_KEY) || "";
    if (!resolvedProductId) {
      const firstMock = MOCK_PRODUCTS[0];
      setProduct(firstMock ? { id: firstMock.id, name: firstMock.name, price: firstMock.price, images: firstMock.images, state: firstMock.state, craft: firstMock.craft } : null);
      setLoadingProduct(false);
      return;
    }
    localStorage.setItem(LAST_PRODUCT_KEY, resolvedProductId);
    if (shouldUseMockData()) {
      const mock = MOCK_PRODUCTS.find((p) => p.id === resolvedProductId) ?? MOCK_PRODUCTS[0];
      setProduct(mock ? { id: mock.id, name: mock.name, price: mock.price, images: mock.images, state: mock.state, craft: mock.craft } : null);
      setLoadingProduct(false);
      return;
    }
    supabase.from("products").select("id,name,price,images,state,craft").eq("id", resolvedProductId).maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setProduct(data as ProductLite);
          setLoadingProduct(false);
          return;
        }
        const { data: anyProduct } = await supabase.from("products").select("id,name,price,images,state,craft").eq("is_published", true).limit(1).maybeSingle();
        setProduct((anyProduct as ProductLite | null) ?? (MOCK_PRODUCTS[0] ? { id: MOCK_PRODUCTS[0].id, name: MOCK_PRODUCTS[0].name, price: MOCK_PRODUCTS[0].price, images: MOCK_PRODUCTS[0].images, state: MOCK_PRODUCTS[0].state, craft: MOCK_PRODUCTS[0].craft } : null));
        setLoadingProduct(false);
      });
  }, [productId]);

  const total = useMemo(() => {
    if (!product) return 0;
    return Number(product.price) * quantity;
  }, [product, quantity]);

  const continueToPayment = () => {
    if (!product) return;
    if (!address.trim()) {
      toast.error("Please enter a shipping address.");
      return;
    }
    navigate({
      to: "/payment",
      search: {
        productId: product.id,
        qty: quantity,
        address: address.trim(),
      },
    });
  };

  if (authLoading || loadingProduct) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
          <p className="font-display text-2xl">Product not found for checkout.</p>
          <Link to="/marketplace" className="text-primary hover:underline mt-2 inline-block">Back to marketplace</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />Back to marketplace
        </Link>
        <h1 className="section-title mb-8">Checkout</h1>
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="surface-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Shipping address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, city, state, PIN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                inputMode="numeric"
                value={String(quantity)}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value.replace(/[^\d]/g, "")) || 1))}
              />
            </div>
            <Button onClick={continueToPayment} className="w-full bg-primary hover:bg-primary/90">
              Continue to payment
            </Button>
          </section>

          <aside className="surface-card p-4 space-y-3 h-fit">
            <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden">
              {product.images?.[0] ? (
                <img src={normalizeImageUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            <p className="font-display text-xl">{product.name}</p>
            <div className="text-sm text-muted-foreground">{product.craft} • {product.state}</div>
            <div className="flex items-center justify-between text-sm">
              <span>Unit price</span>
              <span>₹{Number(product.price).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Qty</span>
              <span>{quantity}</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between font-medium">
              <span>Total</span>
              <span className="text-primary">₹{Number(total).toLocaleString("en-IN")}</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
