import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/complete-profile")({
  validateSearch: (s) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const { user, profile, loading, saveProfile } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [role, setRole] = useState<AppRole>("customer");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin", redirect: safeRedirect } });
  }, [loading, user, navigate, safeRedirect]);

  useEffect(() => {
    if (profile?.role) {
      setRole(profile.role === "admin" ? "artisan" : profile.role);
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      await saveProfile({ displayName: displayName.trim(), role, email: user?.email ?? null });
      toast.success("Profile saved.");
      if (safeRedirect === "/") navigate({ to: "/" });
      else window.location.assign(safeRedirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main flex items-center justify-center">
        <form onSubmit={submit} className="surface-card w-full max-w-lg p-6 md:p-8 space-y-5">
          <div>
            <h1 className="font-display text-3xl">Complete your profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Tell us your name and how you want to use Karigari.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-name">Full name</Label>
            <Input id="cp-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>I am a...</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-2 gap-2">
              <Label htmlFor="cp-customer" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                <RadioGroupItem id="cp-customer" value="customer" />
                <span className="font-normal">Customer</span>
              </Label>
              <Label htmlFor="cp-artisan" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                <RadioGroupItem id="cp-artisan" value="artisan" />
                <span className="font-normal">Artisan</span>
              </Label>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save and continue"}
          </Button>
        </form>
      </main>
    </div>
  );
}
