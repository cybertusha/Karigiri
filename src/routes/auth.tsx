import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import authBg from "@/assets/auth-bg.png";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { getUserProfile } from "@/lib/user-profile";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  display_name: z.string().min(2).max(80),
  role: z.enum(["artisan", "customer"]),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => ({
    mode: (s.mode as string) === "signup" ? "signup" : "signin",
    redirect: typeof s.redirect === "string" ? s.redirect : "",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  useEffect(() => {
    if (!loading && user && profile) {
      if (safeRedirect === "/") navigate({ to: "/" });
      else window.location.assign(safeRedirect);
    }
    if (!loading && user && !profile) {
      navigate({ to: "/complete-profile", search: { redirect: safeRedirect } });
    }
  }, [user, profile, loading, navigate, mode, safeRedirect]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Warli art background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${authBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            <h1 className="font-display text-3xl font-medium mb-1">Welcome</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign in or create an account to continue.</p>

            <Tabs defaultValue={mode}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin"><SignInForm /></TabsContent>
              <TabsContent value="signup"><SignUpForm /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  const signInWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const res = await signInWithPopup(firebaseAuth, googleProvider);
      const dbProfile = await getUserProfile(res.user.uid);
      if (!dbProfile) {
        toast.info("Complete your profile to continue.");
        navigate({ to: "/complete-profile", search: { redirect: safeRedirect } });
      } else if (safeRedirect === "/") {
        toast.success("Signed in with Google.");
        navigate({ to: "/" });
      } else {
        toast.success("Signed in with Google.");
        window.location.assign(safeRedirect);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      toast.error(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const dbProfile = await getUserProfile(cred.user.uid);
      if (!dbProfile) {
        toast.info("Complete your profile to continue.");
        navigate({ to: "/complete-profile", search: { redirect: safeRedirect } });
      } else if (safeRedirect === "/") {
        toast.success("Welcome back!");
        navigate({ to: "/" });
      } else {
        toast.success("Welcome back!");
        window.location.assign(safeRedirect);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      if (msg.includes("invalid login credentials")) {
        toast.error("Invalid email or password.");
      } else if (msg.includes("auth/invalid-credential")) {
        toast.error("Invalid email or password.");
      } else if (msg.includes("email not confirmed")) {
        toast.error("Please verify your email before signing in.");
      } else {
        toast.error(error instanceof Error ? error.message : "Sign-in failed.");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4 mt-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy || googleBusy}
        onClick={signInWithGoogle}
      >
        {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or use email</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-password">Password</Label>
        <Input id="si-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"artisan" | "customer">("customer");
  const [busy, setBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [googleBusy, setGoogleBusy] = useState(false);
  const { redirect } = Route.useSearch();
  const { saveProfile } = useAuth();
  const navigate = useNavigate();
  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  const signUpWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      toast.success("Google account connected. Complete your profile to continue.");
      navigate({ to: "/complete-profile", search: { redirect: safeRedirect } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-up failed.");
    } finally {
      setGoogleBusy(false);
    }
  };

  useEffect(() => {
    if (cooldownUntil <= now) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cooldownUntil, now]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = Date.now();
    if (cooldownUntil > current) {
      const seconds = Math.ceil((cooldownUntil - current) / 1000);
      toast.error(`Please wait ${seconds}s before trying sign up again.`);
      return;
    }
    const parsed = SignupSchema.safeParse({ email, password, display_name: displayName, role });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await saveProfile({ displayName: displayName.trim(), role, email: cred.user.email });
      toast.success("Account created!");
      if (safeRedirect === "/") navigate({ to: "/" });
      else window.location.assign(safeRedirect);
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      if (msg.includes("too-many-requests")) {
        setCooldownUntil(Date.now() + 60_000);
        toast.error("Too many attempts. Please wait 60s and try again.");
      } else if (msg.includes("email-already-in-use")) {
        toast.error("This email is already registered. Please sign in.");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not create account.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 mt-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy || googleBusy || cooldownUntil > now}
        onClick={signUpWithGoogle}
      >
        {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign up with Google"}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or create with email</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Display name</Label>
        <Input id="su-name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-password">Password</Label>
        <Input id="su-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label>I am a...</Label>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as "artisan" | "customer")} className="grid grid-cols-2 gap-2">
          <Label htmlFor="r-customer" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
            <RadioGroupItem id="r-customer" value="customer" />
            <span className="font-normal">Customer</span>
          </Label>
          <Label htmlFor="r-artisan" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
            <RadioGroupItem id="r-artisan" value="artisan" />
            <span className="font-normal">Artisan</span>
          </Label>
        </RadioGroup>
      </div>
      <Button type="submit" className="w-full" disabled={busy || cooldownUntil > now}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
      {cooldownUntil > now ? (
        <p className="text-xs text-muted-foreground text-center">
          Signup temporarily limited. Try again in {Math.ceil((cooldownUntil - now) / 1000)}s.
        </p>
      ) : null}
    </form>
  );
}
