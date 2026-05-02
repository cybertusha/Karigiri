import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductInput } from "@/components/dashboard/ProductForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { CRAFT_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/lib/mock-products";
import { disableMockDataMode, enableMockDataMode, isSchemaMissingError, shouldUseMockData } from "@/lib/data-mode";
import { normalizeImageUrl } from "@/lib/image-url";

interface Product {
  id: string; name: string; description: string; price: number;
  state: string; craft: string; images: string[]; is_published: boolean;
}

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, isArtisan, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductInput | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    if (shouldUseMockData()) {
      const demoProducts: Product[] = MOCK_PRODUCTS.map((p) => ({
        ...p,
        is_published: true,
      }));
      setProducts(demoProducts);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("products").select("*")
      .eq("artisan_id", user.id).order("created_at", { ascending: false });
    if (!error) disableMockDataMode();
    if (isSchemaMissingError(error)) enableMockDataMode();
    if (!error && data && data.length > 0) {
      setProducts(data as Product[]);
    } else {
      const demoProducts: Product[] = MOCK_PRODUCTS.map((p) => ({
        ...p,
        is_published: true,
      }));
      setProducts(demoProducts);
    }
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const startNew = () => { setEditing(null); setOpen(true); };
  const startEdit = (p: Product) => {
    setEditing({ id: p.id, name: p.name, description: p.description, price: String(p.price),
      state: p.state, craft: p.craft, images: p.images });
    setOpen(true);
  };
  const onSaved = () => { setOpen(false); load(); };

  const doDelete = async () => {
    if (!confirmDel) return;
    if (shouldUseMockData()) {
      setProducts((prev) => prev.filter((p) => p.id !== confirmDel));
      toast.success("Deleted from mock list.");
      setConfirmDel(null);
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", confirmDel);
    if (error) toast.error(error.message);
    else { toast.success("Product deleted"); load(); }
    setConfirmDel(null);
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="section-title">Your studio</h1>
            <p className="section-subtitle">Manage your handmade pieces.</p>
          </div>
          {isArtisan && <Button onClick={startNew} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />New product</Button>}
        </div>

        {!isArtisan ? (
          <div className="surface-card p-10 text-center">
            <p className="font-display text-lg mb-2">You're signed in as a customer.</p>
            <p className="text-sm text-muted-foreground">To list products, create an artisan account.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="surface-card border-dashed p-16 text-center">
            <PackagePlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-xl mb-1">No products yet</p>
            <p className="text-sm text-muted-foreground mb-6">Add your first piece — the AI assistant can help write the description.</p>
            <Button onClick={startNew}><Plus className="h-4 w-4 mr-1.5" />Add a product</Button>
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium hidden md:table-cell">Craft</th>
                  <th className="p-3 font-medium hidden md:table-cell">State</th>
                  <th className="p-3 font-medium text-right">Price</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                          {p.images?.[0] && <img src={normalizeImageUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{CRAFT_TYPES.find((c) => c.value === p.craft)?.label}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{p.state}</td>
                    <td className="p-3 text-right font-medium">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDel(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing?.id ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>
              Add or update your product details, then publish it to your artisan dashboard.
            </DialogDescription>
          </DialogHeader>
          <ProductForm initial={editing ?? undefined} onSaved={onSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
