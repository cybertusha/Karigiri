import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<AppRole>("customer");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin", redirect: "/profile" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.role) setRole(profile.role === "admin" ? "artisan" : profile.role);
  }, [profile]);

  const onSaveRole = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await saveProfile({
        displayName: profile?.displayName || user.displayName || "User",
        role,
        email: user.email,
      });
      toast.success("Role updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="page-wrap">
      <Header />
      <main className="page-main flex justify-center">
        <div className="max-w-2xl surface-card p-6 md:p-8 space-y-6">
          <div>
            <h1 className="section-title text-3xl">Profile</h1>
            <p className="section-subtitle">{user.email}</p>
          </div>
          <div className="space-y-3">
            <Label>Switch account role</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid sm:grid-cols-2 gap-3">
              <Label htmlFor="profile-customer" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                <RadioGroupItem id="profile-customer" value="customer" />
                <span className="font-normal">Customer</span>
              </Label>
              <Label htmlFor="profile-artisan" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                <RadioGroupItem id="profile-artisan" value="artisan" />
                <span className="font-normal">Artisan</span>
              </Label>
            </RadioGroup>
          </div>
          <Button onClick={onSaveRole} disabled={busy} className="bg-primary hover:bg-primary/90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save role"}
          </Button>
        </div>
      </main>
    </div>
  );
}
