import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { NotebookPen, Sparkles, HeartPulse, TrendingUp, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useApp } from "../lib/store";
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
  const [email, setEmail] = useState("john.smith@school.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (!password) {
      setError(
        mode === "signin"
          ? "Enter your password, or use the Forgot password link below to reset it."
          : "Choose a password with at least 8 characters."
      );
      return;
    }
    setError(null);
    login();
    navigate("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
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

        <p className="relative text-xs font-semibold text-(--color-paper)/40">
          Staff access only.
        </p>
      </div>

      {/* Auth form */}
      <div className="flex items-center justify-center bg-(--color-paper) px-6 py-12">
        <div className="w-full max-w-sm rounded-(--radius-card) border-[3px] border-(--color-border) bg-(--color-surface) p-7 shadow-hard-lg">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-(--color-border) bg-(--color-orange-500) text-(--color-ink-on-accent)">
              <NotebookPen size={16} strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold">Homeroom</span>
          </div>

          <div className="mb-6 flex rounded-lg border-2 border-(--color-border) bg-(--color-paper-dim) p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
                mode === "signin" ? "bg-(--color-surface) text-(--color-ink)" : "text-(--color-ink-muted)"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
                mode === "signup" ? "bg-(--color-surface) text-(--color-ink)" : "text-(--color-ink-muted)"
              }`}
            >
              Sign up
            </button>
          </div>

          <h2 className="font-display text-2xl font-bold text-(--color-ink)">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm font-medium text-(--color-ink-muted)">
            {mode === "signin"
              ? "Sign in with your school email to open your timetable."
              : "Set up your teacher account to start building lessons."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border-2 border-(--color-border) bg-(--color-danger-100) px-3 py-2.5 text-sm font-semibold text-(--color-danger)">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3.5 py-2.5 text-sm font-medium text-(--color-ink) outline-none placeholder:text-(--color-ink-muted) focus:ring-2 focus:ring-(--color-sky-500)/30"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-bold text-(--color-ink)">
              Password
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border-2 border-(--color-border) bg-(--color-surface) px-3.5 py-2.5 pr-10 text-sm font-medium text-(--color-ink) outline-none placeholder:text-(--color-ink-muted) focus:ring-2 focus:ring-(--color-sky-500)/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-(--color-ink-muted) hover:text-(--color-ink)"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {mode === "signin" && (
              <button type="button" className="self-end text-xs font-bold text-(--color-sky-600) hover:underline">
                Forgot password?
              </button>
            )}

            <Button type="submit" size="lg" className="mt-1 justify-between">
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-(--color-ink-muted)">
            Every class, student, and score is scoped to your account. Nobody else can see or edit your data.
          </p>
        </div>
      </div>
    </div>
  );
}
