import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumen" },
      { name: "description", content: "Sign in or create your Lumen account." },
    ],
  }),
  component: AuthPage,
});

// ─── helpers ──────────────────────────────────────────────────────────────

function inputCls(error?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-3 text-[15px] transition-colors",
    "bg-white/70 dark:bg-white/10",
    "text-foreground placeholder:text-muted-foreground/60",
    error
      ? "border-red-400 focus:ring-red-300/30"
      : "border-border focus:border-[#3F6E67]/50 focus:ring-[#3F6E67]/20",
    "focus:outline-none focus:ring-2",
  ].join(" ");
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function PasswordReq({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? "text-[#3F6E67]" : "text-muted-foreground"}`}>
      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />}
      {label}
    </li>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="gradient-primary group relative w-full overflow-hidden rounded-full px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
      {message}
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#3F6E67]/30 bg-[#3F6E67]/10 px-4 py-3 text-sm text-[#3F6E67] dark:bg-[#3F6E67]/20">
      {message}
    </div>
  );
}

// ─── Sign In ──────────────────────────────────────────────────────────────

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Resolve email — if identifier looks like a username (no @), look up email
      let email = identifier.trim();

      if (!email.includes("@")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", email)
          .single();

        if (!profile?.email) {
          throw new Error("No account found with that username.");
        }
        email = profile.email;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.session) throw new Error("Sign in failed — no session returned.");

      // If remember is unchecked, sign out on tab close using sessionStorage flag
      if (!remember) {
        sessionStorage.setItem("lumen-session-temp", "1");
      } else {
        sessionStorage.removeItem("lumen-session-temp");
      }

      navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const email = identifier.trim();
    if (!email) { setError("Enter your email address first."); return; }
    if (!email.includes("@")) { setError("Enter your email address (not username) for password reset."); return; }
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    setError(e ? e.message : "Password reset email sent — check your inbox.");
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Welcome!</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Sign in to Lumen</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Access all features and continue where you left off.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <ErrorBanner message={error} />}

        <div>
          <FieldLabel htmlFor="identifier">Email Address or Username</FieldLabel>
          <input
            id="identifier"
            type="text"
            required
            autoComplete="email"
            placeholder="Enter your email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={inputCls()}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel htmlFor="signin-password">Password</FieldLabel>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[#3F6E67] hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls()} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[#3F6E67]"
          />
          <label htmlFor="remember" className="cursor-pointer select-none text-sm text-muted-foreground">
            Remember Me
          </label>
        </div>

        <SubmitBtn loading={loading}>Sign in</SubmitBtn>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <button onClick={onSwitch} className="font-semibold text-foreground hover:underline">
          Create an account
        </button>
      </p>
    </>
  );
}

// ─── Sign Up ──────────────────────────────────────────────────────────────

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@#$%!^&*]/.test(password),
  };
  const allReqsMet = Object.values(reqs).every(Boolean);
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!allReqsMet) { setError("Password does not meet all requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);

    try {
      // Step 1 — create auth user, store all profile data in user_metadata
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim(),
            mobile: mobile.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Signup failed — no user returned.");

      // Step 2 — if we have a live session (email confirm disabled), upsert profile now
      if (signUpData.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          full_name: fullName.trim(),
          username: username.trim() || null,
          mobile: mobile.trim() || null,
          email: email.trim(),
        });

        if (profileError) {
          console.warn("[profiles upsert]", profileError.message);
        }

        // Redirect immediately — user is active
        navigate({ to: "/" });
        return;
      }

      // Step 3 — email confirmation required
      // Profile will be created by DB trigger once user confirms email
      setSuccess(
        "Account created! We've sent a confirmation email to " +
        email.trim() +
        ". Please confirm your email then sign in."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">Welcome!</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Create your account to access all features and get started.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}

        {!success && (
          <>
            {/* Personal Information */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">
                Personal Information
              </p>
              <div className="space-y-3">
                <div>
                  <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                  <input
                    id="full-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="signup-email">Email Address</FieldLabel>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls()}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="mobile">Mobile Number</FieldLabel>
                  <input
                    id="mobile"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3F6E67]">
                Account Information
              </p>
              <div className="space-y-3">
                <div>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <input
                    id="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                    className={inputCls()}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPw ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls()} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`${inputCls(mismatch)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className="rounded-2xl border border-border bg-white/50 px-4 py-3 dark:bg-white/5">
                <p className="mb-1.5 text-xs font-semibold text-foreground">Password Requirements</p>
                <p className="mb-2 text-xs text-muted-foreground">Your password should include:</p>
                <ul className="space-y-1">
                  <PasswordReq met={reqs.length} label="At least 8 characters" />
                  <PasswordReq met={reqs.upper} label="One uppercase letter (A–Z)" />
                  <PasswordReq met={reqs.lower} label="One lowercase letter (a–z)" />
                  <PasswordReq met={reqs.number} label="One number (0–9)" />
                  <PasswordReq met={reqs.special} label="One special character (e.g., @, #, $, %)" />
                </ul>
              </div>
            )}

            <SubmitBtn loading={loading}>Create account</SubmitBtn>
          </>
        )}

        {success && (
          <button
            type="button"
            onClick={onSwitch}
            className="gradient-primary w-full rounded-full px-5 py-3 text-sm font-semibold text-white shadow-soft"
          >
            Go to Sign in
          </button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already with us?{" "}
        <button onClick={onSwitch} className="font-semibold text-foreground hover:underline">
          Sign in
        </button>
      </p>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!loading && user && !redirected.current) {
      redirected.current = true;
      navigate({ to: "/" });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <Link to="/" aria-label="Lumen home">
            <span className="gradient-primary grid h-12 w-12 place-items-center rounded-full text-white shadow-soft">
              <span className="font-display text-xl leading-none">L</span>
            </span>
          </Link>
        </div>

        <div className="glass-strong rounded-[2rem] p-6 sm:p-8 shadow-luxe dark:bg-[rgba(28,46,42,0.82)] dark:border-white/10">
          {mode === "signin" ? (
            <SignInForm onSwitch={() => setMode("signup")} />
          ) : (
            <SignUpForm onSwitch={() => setMode("signin")} />
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
