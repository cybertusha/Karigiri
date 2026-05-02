import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-success")({
  validateSearch: (s) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : "",
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderId } = Route.useSearch();
  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main py-16">
        <div className="max-w-xl mx-auto surface-card p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-medium mb-2">Order placed successfully</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for supporting handmade craft. Your order is now in pending confirmation.
          </p>
          {orderId && (
            <p className="text-sm mb-6">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/marketplace">Continue shopping</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
