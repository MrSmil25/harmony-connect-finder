import { useState } from "react";
import { GraduationCap, Loader2, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/**
 * Entry point of the workspace: email/password or Google.
 * Uses the same academic card, colors, and typography as the rest of the app.
 */
export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) setError(friendly(signUpError.message));
      else if (!data.session) setMessage("Check your inbox to confirm the account, then sign in.");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) setError(friendly(signInError.message));
    }
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError("Google sign-in did not complete. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold">RASYID ACADEMIC</p>
            <p className="text-xs text-muted-foreground">Your personal academic workspace</p>
          </div>
        </div>

        <div className="academic-card overflow-hidden">
          <div className="h-1.5 bg-primary" />
          <div className="p-6 md:p-7">
            <h1 className="text-xl font-bold">{mode === "signin" ? "Welcome back" : "Create your workspace"}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {mode === "signin"
                ? "Sign in to open your courses, curriculum, tasks, and study materials."
                : "One account keeps your academic data private and available on every device."}
            </p>

            <Button variant="outline" className="mt-5 w-full" onClick={google} disabled={busy}>
              <LogIn /> Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@ui.ac.id"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Password</span>
                <input
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              {error && <p className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">{error}</p>}
              {message && <p className="rounded-xl bg-success/12 p-3 text-xs font-medium text-success">{message}</p>}

              <Button type="submit" variant="academic" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Mail />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}
              className="mt-5 w-full text-center text-xs font-semibold text-academic"
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendly(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("invalid login")) return "Email or password is not correct.";
  if (text.includes("already registered")) return "That email already has an account — sign in instead.";
  if (text.includes("pwned") || text.includes("compromised")) return "That password appears in known data leaks. Please choose another one.";
  if (text.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
}
