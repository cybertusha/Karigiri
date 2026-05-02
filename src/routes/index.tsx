import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductRow } from "@/components/marketplace/ProductCard";
import { ArrowRight, Sparkles, Hand, Store } from "lucide-react";
import heroImg from "@/assets/hero-artisan.jpg";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { disableMockDataMode, enableMockDataMode, isSchemaMissingError, shouldUseMockData } from "@/lib/data-mode";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Karigari — Handcrafted by Local Artisans" },
      { name: "description", content: "Discover one-of-a-kind handcrafted goods from local artisans across India." },
    ],
  }),
});

function Home() {
  const [featured, setFeatured] = useState<ProductRow[]>([]);

  useEffect(() => {
    if (shouldUseMockData()) {
      setFeatured(MOCK_PRODUCTS.slice(0, 6));
      return;
    }
    supabase.from("products").select("id,name,description,price,state,craft,images")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          disableMockDataMode();
          setFeatured(data as ProductRow[]);
          return;
        }
        if (isSchemaMissingError(error)) enableMockDataMode();
        setFeatured(MOCK_PRODUCTS.slice(0, 6));
      });
  }, []);

  return (
    <div className="page-wrap">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 pt-12 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                AI-powered marketplace for makers
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight">
                Handmade,<br />
                <span className="italic text-primary">with a story.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Discover original work from local artisans across India. Pottery, textiles, jewelry — each piece carries the mark of the hand that made it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-[var(--shadow-soft)]">
                  <Link to="/marketplace">Browse marketplace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">Sell your craft</Link>
                </Button>
              </div>
            </div>
            <div className="relative max-w-[540px] md:ml-auto">
              <div className="absolute -inset-4 rounded-3xl bg-[var(--gradient-warm)] opacity-20 blur-3xl" />
              <img
                src={heroImg}
                alt="Artisan hands shaping clay on a pottery wheel"
                width={1600} height={1200}
                className="relative rounded-3xl shadow-[var(--shadow-elevated)] aspect-[5/4] object-cover border border-border/50"
              />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="container mx-auto px-4 md:px-6 py-12 grid sm:grid-cols-3 gap-6">
          {[
            { icon: Hand, title: "Made by hand", body: "Every piece crafted by an independent artisan, never mass-produced." },
            { icon: Sparkles, title: "AI that helps", body: "Smart search and AI-written descriptions — built for both sides of the market." },
            { icon: Store, title: "Direct from the maker", body: "Your money goes to the people shaping the clay, weaving the cloth." },
          ].map((b) => (
            <div key={b.title} className="surface-card p-6">
              <b.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-display text-lg font-medium mb-1.5">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="container mx-auto px-4 md:px-6 py-12">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-medium">Newly arrived</h2>
              <Link to="/marketplace" className="text-sm text-primary hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
