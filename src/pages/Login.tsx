import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NotebookPen, Sparkles, HeartPulse, TrendingUp, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useApp } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui";

const pillars = [
  {
    icon: Sparkles,
    title: "AI drafts the timetable",
    body: "Upload a screenshot and let the AI extract every period. You just confirm it.",
  },
  {
    icon: HeartPulse,
    title: "Resilience, tracked daily",
    body: "Entry and exit mood check-ins turn wellbeing into something you can actually see.",
  },
  {
    icon: TrendingUp,
    title: "Kaizen, made visible",
    body: "Class goals and week-over-week trends show the room improving, not just behaving.",
  },
];

type Mode = "signin" | "signup";

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("teacher123@test.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          login();
          navigate("/");
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [login, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError(mode === "signin" ? "Enter your password." : "Password must be at least 6 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMode("signin");
        setPassword("");
        alert("Account created! Please sign in.");
        return;
      }

      login();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">🏠</div>
          <p className="text-gray-600">Loading Homeroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <div className="dot-grid relative hidden flex-col justify-between overflow-hidden bg-(--color-ink) px-12 py-10 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-(--color-ink) via-(--color-ink)/95 to-(--color-orange-600)/30" />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-(--color-paper) bg-(--color-orange-500) text-(--color-ink-on-accent)">
            <NotebookPen size={19} strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-(--color-paper)">Homeroom</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-5xl font-bold leading-[1.05] text-(--color-paper)">
            Run the lesson. Watch the room grow.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-(--color-paper)/70">
            One infinite whiteboard for teaching, points, and wellbeing. Built for the front of the classroom.
          </p>

          <div className="mt-10 flex flex-col gap-5">
            {pillars.map((p) => (
              <div key={p.title} className="flex gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-(--color-paper)/30 bg-(--color-paper)/10">
                  <p.icon size={17} strokeWidth={2} className="text-(--color-paper)" />
                </div>
                <div>
                  <p className="text-sm font-bold text-(--color-paper)">{p.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-(--color-paper)/60">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-(--color-paper)/40">Staff access only.</p>
      </div>

      <div className="flex items-center justify-center bg-(--color-paper) px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-bold text-(--color-ink)">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-(--color-ink)/60">
              {mode === "signin" ? "Sign in with your school email." : "Set up your Homeroom account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-(--color-ink) mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-(--color-ink)/10 px-4 py-3 focus:border-(--color-orange-500) focus:outline-none"
                placeholder="your.email@school.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-(--color-ink) mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-2 border-(--color-ink)/10 px-4 py-3 focus:border-(--color-orange-500) focus:outline-none pr-10"
                  placeholder={mode === "signin" ? "Enter your password" : "At least 6 characters"}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-ink)/40"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-(--color-orange-500) text-(--color-ink-on-accent) font-semibold py-3 rounded-lg"
            >
              {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--color-ink)/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-(--color-paper) px-2 text-(--color-ink)/60">
                {mode === "signin" ? "New here?" : "Have an account?"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setPassword("");
            }}
            className="w-full py-2 text-(--color-orange-600) font-semibold"
          >
            {mode === "signin" ? "Create an account" : "Sign in instead"}
          </button>

          {mode === "signin" && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-semibold mb-2">ℹ️ Demo Access</p>
              <p className="text-xs">Contact your administrator for demo account credentials</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
