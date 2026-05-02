import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoPng from "@/assets/logo.png";

export function Header() {
  const { user, isArtisan, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 py-2">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 border border-border/70 shadow-[var(--shadow-soft)] overflow-hidden transition-transform group-hover:scale-105">
            <img src={logoPng} alt="Artisan AI" className="h-full w-full object-contain p-1.5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Artisan AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 text-sm font-medium rounded-full border border-border/70 bg-card/80 px-2 py-1">
          <Link to="/" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors" activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-foreground" }}>Home</Link>
          <Link to="/marketplace" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "bg-secondary text-foreground" }}>Marketplace</Link>
          {isArtisan && (
            <Link to="/dashboard" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "bg-secondary text-foreground" }}>Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <User className="h-4 w-4 mr-1.5" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { void signOut().then(() => navigate({ to: "/" })); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
