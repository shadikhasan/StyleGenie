import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

interface LoginFormState {
  email: string;
  password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const errorRegionRef = useRef<HTMLDivElement | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Optional: avoid UI flash if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  const emailValid = useMemo(
    () => EMAIL_RE.test(formData.email.trim()),
    [formData.email]
  );
  const passwordValid = useMemo(
    () => formData.password.trim().length >= 6,
    [formData.password]
  );
  const formValid = emailValid && passwordValid;

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginFormState) => {
      // Fixed role = "client" (stylist role removed)
      const user = await login("client", {
        email: payload.email.trim(),
        password: payload.password,
      });
      return user;
    },
    onSuccess: () => {
      setFormError(null);
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      let message = "Unable to login. Please try again.";
      if (error instanceof ApiError) message = error.message;
      setFormError(message);
      // Move focus to error region for screen readers
      requestAnimationFrame(() => errorRegionRef.current?.focus());
      toast.error(message);
    },
  });

  const updateField = (field: keyof LoginFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (formError) setFormError(null); // clear stale error as user edits
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || loginMutation.isPending) return;

    const payload: LoginFormState = {
      email: formData.email.trim(),
      password: formData.password,
    };

    // Client-side guardrails
    if (!EMAIL_RE.test(payload.email)) {
      emailRef.current?.focus();
      setFormError("Please enter a valid email address.");
      return;
    }
    if (payload.password.trim().length < 6) {
      passwordRef.current?.focus();
      setFormError("Password must be at least 6 characters.");
      return;
    }

    loginMutation.mutate(payload);
  };

  useEffect(() => {
    // cleanup error on unmount
    return () => setFormError(null);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-large bg-gradient-card border-none animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <LogoMark className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              StyleGenie
            </span>
          </Link>
        </div>

        {/* Error region (screen-reader friendly) */}
        <div
          ref={errorRegionRef}
          tabIndex={formError ? -1 : undefined}
          aria-live="assertive"
          className="mb-2 text-sm text-destructive min-h-[1rem]"
        >
          {formError}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={!emailValid}
              aria-describedby="email-help"
              required
            />
            <p id="email-help" className="text-xs text-muted-foreground">
              Use the email you registered with.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <Input
                ref={passwordRef}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                aria-invalid={!passwordValid}
                aria-describedby="password-help"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center rounded p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring focus-visible:ring-primary/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p id="password-help" className="text-xs text-muted-foreground">
              Minimum 6 characters.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!formValid || loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm space-y-4">
          <div>
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
