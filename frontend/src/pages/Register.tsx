import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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

interface RegisterFormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// loose E.164 (optional, allow empty)
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  type FormErrorState = { message: string; type: "validation" | "server" } | null;
  const [formError, setFormError] = useState<FormErrorState>(null);
  type FieldName = keyof RegisterFormState;
  type FieldError = { message: string; source: "client" | "server" };
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, FieldError>>>({});

  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);
  const errorRegionRef = useRef<HTMLDivElement | null>(null);

  const fieldRefs: Record<FieldName, RefObject<HTMLInputElement | null>> = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    username: usernameRef,
    email: emailRef,
    phone: phoneRef,
    password: passwordRef,
    confirmPassword: confirmRef,
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  // Derived validity
  const firstNameValid = useMemo(
    () => formData.firstName.trim().length >= 1,
    [formData.firstName]
  );
  const lastNameValid = useMemo(
    () => formData.lastName.trim().length >= 1,
    [formData.lastName]
  );
  const usernameValid = useMemo(
    () => formData.username.trim().length >= 3,
    [formData.username]
  );
  const emailValid = useMemo(
    () => EMAIL_RE.test(formData.email.trim()),
    [formData.email]
  );
  const phoneValid = useMemo(() => {
    const p = formData.phone.trim();
    return p.length === 0 || PHONE_RE.test(p);
  }, [formData.phone]);
  const passwordValid = useMemo(
    () => formData.password.trim().length >= 6,
    [formData.password]
  );
  const confirmValid = useMemo(
    () =>
      formData.confirmPassword.trim().length >= 6 &&
      formData.confirmPassword === formData.password,
    [formData.confirmPassword, formData.password]
  );

  const sanitizeForm = () => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    username: formData.username.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  });

  type SanitizedForm = ReturnType<typeof sanitizeForm>;

  const stepForField = (field: FieldName) =>
    field === "password" || field === "confirmPassword" ? 2 : 1;

  const getServerFieldError = (stepFilter?: 1 | 2): FieldName | null => {
    for (const [field, error] of Object.entries(fieldErrors) as [FieldName, FieldError][]) {
      if (error?.source === "server" && (!stepFilter || stepForField(field) === stepFilter)) {
        return field;
      }
    }
    return null;
  };

  const focusField = (field: FieldName) => {
    const ref = fieldRefs[field];
    requestAnimationFrame(() => ref?.current?.focus());
  };

  const SERVER_FIELD_MAP: Record<string, FieldName> = {
    first_name: "firstName",
    firstName: "firstName",
    last_name: "lastName",
    lastName: "lastName",
    username: "username",
    email: "email",
    phone: "phone",
    password: "password",
    confirm_password: "confirmPassword",
    confirmPassword: "confirmPassword",
  };

  const normalizeErrorValue = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string");
      return typeof first === "string" ? first : null;
    }
    if (typeof value === "object") {
      const maybeDetail =
        (value as { message?: unknown }).message ?? (value as { detail?: unknown }).detail;
      return typeof maybeDetail === "string" ? maybeDetail : null;
    }
    return null;
  };

  const parseFieldErrorsFromApi = (data: unknown) => {
    const result: {
      fieldErrors: Partial<Record<FieldName, string>>;
      generalMessage: string | null;
    } = {
      fieldErrors: {},
      generalMessage: null,
    };

    if (!data) {
      return result;
    }

    if (typeof data !== "object") {
      const message = normalizeErrorValue(data);
      if (message) result.generalMessage = message;
      return result;
    }

    if (Array.isArray(data)) {
      const message = normalizeErrorValue(data);
      if (message) result.generalMessage = message;
      return result;
    }

    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (key === "detail" || key === "non_field_errors") {
        const message = normalizeErrorValue(value);
        if (message) {
          result.generalMessage = message;
        }
        return;
      }

      const mappedField = SERVER_FIELD_MAP[key];
      const message = normalizeErrorValue(value);
      if (mappedField && message) {
        result.fieldErrors[mappedField] = message;
        return;
      }

      if (!result.generalMessage && message) {
        result.generalMessage = message;
      }
    });

    return result;
  };

  const clearValidationErrors = () => {
    setFieldErrors((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      let changed = false;
      (Object.entries(prev) as [FieldName, FieldError][]).forEach(([field, value]) => {
        if (value?.source === "client") {
          delete next[field];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    setFormError((prev) => (prev?.type === "validation" ? null : prev));
  };

  const applyServerFieldErrors = (errors: Partial<Record<FieldName, string>>) => {
    setFieldErrors((prev) => {
      const next: Partial<Record<FieldName, FieldError>> = { ...prev };
      let changed = false;

      (Object.entries(prev) as [FieldName, FieldError][]).forEach(([field, value]) => {
        if (value?.source === "server") {
          delete next[field];
          changed = true;
        }
      });

      Object.entries(errors).forEach(([key, message]) => {
        if (!message) return;
        const field = key as FieldName;
        next[field] = { message, source: "server" };
        changed = true;
      });

      return changed ? next : prev;
    });
  };

  const raiseValidationError = (
    field: FieldName,
    message: string,
    ref?: RefObject<HTMLInputElement | null>
  ) => {
    setFieldErrors((prev) => ({ ...prev, [field]: { message, source: "client" } }));
    setFormError({ message, type: "validation" });
    ref?.current?.focus();
  };

  const ensureStepOneValidity = (data: SanitizedForm) => {
    clearValidationErrors();
    if (data.firstName.length < 1) {
      raiseValidationError("firstName", "Please enter your first name.", firstNameRef);
      return false;
    }
    if (data.lastName.length < 1) {
      raiseValidationError("lastName", "Please enter your last name.", lastNameRef);
      return false;
    }
    if (data.username.length < 3) {
      raiseValidationError("username", "Username must be at least 3 characters.", usernameRef);
      return false;
    }
    if (!EMAIL_RE.test(data.email)) {
      raiseValidationError("email", "Please enter a valid email address.", emailRef);
      return false;
    }
    if (data.phone && !PHONE_RE.test(data.phone)) {
      raiseValidationError("phone", "Please enter a valid phone number (E.164).", phoneRef);
      return false;
    }
    return true;
  };

  const ensureStepTwoValidity = (data: SanitizedForm) => {
    clearValidationErrors();
    if (data.password.trim().length < 6) {
      raiseValidationError("password", "Password must be at least 6 characters.", passwordRef);
      return false;
    }
    if (data.confirmPassword !== data.password) {
      raiseValidationError("confirmPassword", "Passwords do not match.", confirmRef);
      return false;
    }
    return true;
  };

  const goToStepTwo = () => {
    if (registerMutation.isPending) return;
    const blockingField = getServerFieldError(1);
    if (blockingField) {
      const message = fieldErrors[blockingField]?.message ?? "Please fix the highlighted fields.";
      setFormError({ message, type: "validation" });
      setStep(1);
      focusField(blockingField);
      return;
    }
    const data = sanitizeForm();
    if (!ensureStepOneValidity(data)) return;
    setStep(2);
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  type RegisterDTO = {
    email: string;
    username: string;
    password: string;
    phone?: string;
    first_name: string;
    last_name: string;
  };

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterFormState) => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const dto: RegisterDTO = {
        email: payload.email.trim(),
        username: payload.username.trim(),
        password: payload.password,
        phone: payload.phone.trim() || undefined,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      // stylist role removed: fixed role = "client"
      await registerUser("client", dto);

      return {
        email: payload.email.trim(),
        password: payload.password,
      };
    },
    onSuccess: async ({ email, password }) => {
      try {
        await login("client", { email, password });
        toast.success("Account created successfully!");
        navigate("/dashboard", { replace: true });
      } catch {
        toast.success("Account created successfully!");
        toast.info("Please login to continue.");
        navigate("/login", { replace: true });
      }
    },
    onError: (error) => {
      let message =
        error instanceof ApiError
          ? error.message
          : "Unable to create account right now. Please try again.";

      if (error instanceof ApiError) {
        const { fieldErrors: apiFieldErrors, generalMessage } = parseFieldErrorsFromApi(
          error.data
        );

        if (Object.keys(apiFieldErrors).length > 0) {
          applyServerFieldErrors(apiFieldErrors);
          const firstField = Object.keys(apiFieldErrors)[0] as FieldName;
          const focusedMessage = apiFieldErrors[firstField] ?? message;
          setStep(stepForField(firstField));
          setFormError({ message: focusedMessage, type: "validation" });
          focusField(firstField);
          toast.error(focusedMessage);
          return;
        }

        if (generalMessage) {
          message = generalMessage;
        }
      }

      applyServerFieldErrors({});
      setFormError({ message, type: "server" });
      requestAnimationFrame(() => errorRegionRef.current?.focus());
      toast.error(message);
    },
  });

  const updateField = (field: keyof RegisterFormState, value: string) => {
    setFormData((cur) => ({ ...cur, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formError?.type === "validation") setFormError(null);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerMutation.isPending) return;

    if (step === 1) {
      goToStepTwo();
      return;
    }

    const serverField = getServerFieldError();
    if (serverField) {
      const message = fieldErrors[serverField]?.message ?? "Please fix the highlighted fields.";
      setStep(stepForField(serverField));
      setFormError({ message, type: "validation" });
      focusField(serverField);
      return;
    }

    const data = sanitizeForm();

    if (!ensureStepOneValidity(data)) {
      setStep(1);
      return;
    }
    if (!ensureStepTwoValidity(data)) {
      setStep(2);
      return;
    }

    setFormError(null);
    registerMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  useEffect(() => {
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
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">
            Start your personalized style journey
          </p>
        </div>

        {/* Error region (SR-friendly) */}
        <div
          ref={errorRegionRef}
          tabIndex={formError ? -1 : undefined}
          aria-live="assertive"
          className="mb-2 text-sm text-destructive min-h-[1rem]"
        >
          {formError?.message}
        </div>

        {/* Registration Form */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className={step === 1 ? "text-primary" : "text-muted-foreground"}>
              Profile
            </span>
            <span className={step === 2 ? "text-primary" : "text-muted-foreground"}>
              Security
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-hero transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Step {step} of 2
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right">
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    ref={firstNameRef}
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Ayaan"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    aria-invalid={!firstNameValid}
                    required
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    ref={lastNameRef}
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Rahman"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    aria-invalid={!lastNameValid}
                    required
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="style_maven"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  aria-invalid={!usernameValid}
                  required
                />
                <p
                  className={`text-xs ${
                    fieldErrors.username ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {fieldErrors.username?.message ?? "At least 3 characters."}
                </p>
              </div>

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
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  ref={phoneRef}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+8801234567890"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  aria-invalid={!phoneValid}
                />
                <p
                  className={`text-xs ${
                    fieldErrors.phone ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {fieldErrors.phone?.message ?? "Use international format (e.g., +8801XXXXXXXXX)."}
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={goToStepTwo}
                disabled={registerMutation.isPending}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    aria-invalid={!passwordValid}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center rounded p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring focus-visible:ring-primary/40"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    onClick={() => setShowPwd((s) => !s)}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p
                  className={`text-xs ${
                    fieldErrors.password ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {fieldErrors.password?.message ?? "Minimum 6 characters."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    ref={confirmRef}
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    aria-invalid={!confirmValid}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center rounded p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring focus-visible:ring-primary/40"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setStep(1);
                    setFormError((prev) => (prev?.type === "validation" ? null : prev));
                    requestAnimationFrame(() => usernameRef.current?.focus());
                  }}
                  disabled={registerMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:flex-1"
                  size="lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Section */}
        <div className="mt-6 text-center text-sm space-y-4">
          <div>
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login
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

export default Register;
