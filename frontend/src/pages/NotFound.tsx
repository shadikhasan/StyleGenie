import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/LogoMark";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Keep console noise low in prod; switch to your logger if you have one
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("404:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/10"
      aria-labelledby="not-found-title"
    >
      {/* Soft glow / deco */}
      <div className="pointer-events-none absolute -inset-40 -z-10 bg-[radial-gradient(closest-side,theme(colors.primary/20),transparent)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-primary/10 to-transparent" />

      <section className="mx-auto w-full max-w-2xl px-6 text-center">
        {/* Brand */}
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <span className="rounded-lg bg-gradient-hero p-2 shadow">
            <LogoMark className="h-6 w-6" />
          </span>
          <span className="bg-gradient-hero bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            StyleGenie
          </span>
        </Link>

        {/* 404 heading */}
        <div className="mb-6">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Error 404
          </div>
          <h1
            id="not-found-title"
            className="mb-2 text-4xl font-black tracking-tight md:text-5xl"
          >
            Page not found
          </h1>
          <p className="mx-auto max-w-prose text-sm text-muted-foreground md:text-base">
            We couldn’t find the page you’re looking for. The route you tried:
          </p>
          <p className="mx-auto mt-2 inline-block rounded-md bg-muted px-2 py-1 font-mono text-sm text-foreground">
            {location.pathname || "/"}
          </p>
        </div>

        {/* Quick actions */}
        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/documentation")}
            className="hover:bg-muted"
          >
            <Search className="mr-2 h-4 w-4" />
            Open Documentation
          </Button>
        </div>

        {/* Helpful tips */}
        <div className="mx-auto mt-8 w-full max-w-md rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm">
          <h2 className="mb-1 text-sm font-semibold">Try this:</h2>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>Check the URL for typos.</li>
            <li>Use the navigation to find the right page.</li>
            <li>
              If you believe this is an error, refresh or return to{" "}
              <Link className="text-primary underline-offset-4 hover:underline" to="/">
                the homepage
              </Link>
              .
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
