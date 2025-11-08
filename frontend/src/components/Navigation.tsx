import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { Menu, X, ChevronDown, Sparkles, PartyPopper, Sparkle, Wand, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { LogoMark } from "@/components/LogoMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** ------------------------------------------------------------------ */
/** Utilities                                                           */
/** ------------------------------------------------------------------ */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

type LinkItem = { to: string; label: string; badge?: string; icon?: React.ReactNode };

const NAV_LINKS: LinkItem[] = [
  { to: "/stylists", label: "Find Stylists" },
  { to: "/dashboard", label: "My Wardrobe" },
  { to: "/recommendations", label: "AI Styling", badge: "Beta", icon: <WandSparkles className="size-4 text-primary" /> },
  { to: "/documentation", label: "Documentation", badge: "New" },
];

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);
  const mobileMenuId = useId();

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : user?.username || "Member";

  const firstInitial = useMemo(
    () => (displayName ? displayName.charAt(0).toUpperCase() : "M"),
    [displayName]
  );

  /** ----------------------------------------------------------------
   * Body scroll lock via class (safer than mutating style in SSR/CSR)
   * --------------------------------------------------------------- */
  useEffect(() => {
    const cls = "overflow-hidden";
    if (isMenuOpen) {
      document.documentElement.classList.add(cls);
    } else {
      document.documentElement.classList.remove(cls);
    }
    return () => document.documentElement.classList.remove(cls);
  }, [isMenuOpen]);

  /** ----------------------------------------------------------------
   * Scroll shadow: guarded for SSR
   * --------------------------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** ----------------------------------------------------------------
   * Close menu on route change (e.g., after navigation)
   * --------------------------------------------------------------- */
  useEffect(() => {
    if (isMenuOpen) setIsMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /** ----------------------------------------------------------------
   * Keyboard: ESC to close menu; focus management in/out
   * --------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      // Focus first focusable link in menu
      firstMobileLinkRef.current?.focus();
    } else {
      // Return focus to toggle
      mobileToggleRef.current?.focus();
    }
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Unable to logout right now. Please try again.");
    }
  };

  const closeMenuAnd = (fn?: () => void) => () => {
    setIsMenuOpen(false);
    fn?.();
  };

  return (
    <nav
      className={cx(
        "fixed inset-x-0 top-0 z-50 border-b border-border/60",
        "bg-background/65 backdrop-blur-md supports-[backdrop-filter]:bg-background/45",
        scrolled ? "shadow-[0_8px_20px_-15px_rgba(0,0,0,0.35)]" : "shadow-none",
        "transition-shadow duration-300"
      )}
      aria-label="Primary"
      role="navigation"
    >
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground shadow"
      >
        Skip to content
      </a>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2"
            aria-label="StyleGenie home"
          >
            <LogoMark className="h-9 w-9 rounded-xl shadow-soft transition-all duration-300 motion-safe:group-hover:shadow-medium motion-safe:group-hover:scale-[1.03]" />
            <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent tracking-tight">
              StyleGenie
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden items-center gap-2 md:flex" role="menubar">
            {NAV_LINKS.map(({ to, label, badge, icon }) => (
              <li key={to} role="none">
                <NavLink
                  to={to}
                  role="menuitem"
                  className={({ isActive }) =>
                    cx(
                      "group relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      "focus:outline-none focus-visible:ring focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:text-primary hover:bg-muted/70"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {icon}
                      <span>{label}</span>
                      
                      {badge && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary/90">
                          {badge}
                        </span>
                      )}
                      <span
                        className={cx(
                          "absolute left-3 right-3 -bottom-0.5 mx-auto h-0.5 rounded-full transition-all duration-300",
                          isActive
                            ? "w-[calc(100%-1.5rem)] bg-primary"
                            : "w-0 bg-primary/70 group-hover:w-[calc(100%-1.5rem)]"
                        )}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs / Profile */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/recommendations")}
                  className="hidden lg:inline-flex border-primary/50 motion-safe:hover:scale-[1.02]"
                >
                  <Sparkles className="mr-2 size-4" />
                  Generate Outfits
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 focus-visible:ring focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      aria-expanded={undefined}
                    >
                      <div className="inline-flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {firstInitial}
                      </div>
                      <span className="max-w-[12ch] truncate">
                        Hi, {displayName}
                      </span>
                      <ChevronDown className="size-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                    aria-label="Account menu"
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/recommendations")}
                    >
                      AI Styling
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="focus-visible:ring focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-primary to-orange-500 text-primary-foreground shadow hover:opacity-95 motion-safe:hover:scale-[1.02]"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            ref={mobileToggleRef}
            className="md:hidden rounded-md p-2 outline-none ring-primary transition focus-visible:ring focus-visible:ring-offset-2"
            aria-controls={mobileMenuId}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((s) => !s)}
          >
            {isMenuOpen ? <X /> : <Menu />}
            <span className="sr-only">
              {isMenuOpen ? "Close menu" : "Open menu"}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            id={mobileMenuId}
            className="md:hidden animate-in fade-in-0 slide-in-from-top-2 py-3"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="rounded-xl border border-border/60 bg-card p-3 shadow-lg">
              <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Menu
              </div>

              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map(({ to, label, badge }, idx) => {
                  const active = location.pathname.startsWith(to);
                  return (
                    <li key={to}>
                      <Link
                        ref={idx === 0 ? firstMobileLinkRef : undefined}
                        to={to}
                        aria-current={active ? "page" : undefined}
                        className={cx(
                          "flex items-center justify-between rounded-lg px-3 py-3 text-base transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/60"
                        )}
                        onClick={closeMenuAnd()}
                      >
                        <span className="font-medium">{label}</span>
                        <span className="flex items-center gap-2">
                          {badge && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary/90">
                              {badge}
                            </span>
                          )}
                          {active && <span className="text-xs">•</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="my-2 h-px bg-border/70" />

              {isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={closeMenuAnd(() => navigate("/dashboard"))}
                  >
                    {displayName.split(" ")[0] || "Dashboard"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={closeMenuAnd(handleLogout)}
                  >
                    Logout
                  </Button>
                  <Button
                    className="col-span-2 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground hover:opacity-95"
                    onClick={closeMenuAnd(() => navigate("/recommendations"))}
                  >
                    <Sparkles className="mr-2 size-4" />
                    Generate Outfits
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={closeMenuAnd(() => navigate("/login"))}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground hover:opacity-95"
                    onClick={closeMenuAnd(() => navigate("/register"))}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
