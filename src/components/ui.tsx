import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";

const colorMap = {
  orange: {
    solid: "bg-(--color-orange-500)",
    soft: "bg-(--color-orange-100)",
    text: "text-(--color-orange-600)",
    border: "border-(--color-orange-500)",
  },
  lime: {
    solid: "bg-(--color-lime-500)",
    soft: "bg-(--color-lime-100)",
    text: "text-(--color-lime-600)",
    border: "border-(--color-lime-500)",
  },
  pink: {
    solid: "bg-(--color-pink-500)",
    soft: "bg-(--color-pink-100)",
    text: "text-(--color-pink-600)",
    border: "border-(--color-pink-500)",
  },
  purple: {
    solid: "bg-(--color-purple-500)",
    soft: "bg-(--color-purple-100)",
    text: "text-(--color-purple-600)",
    border: "border-(--color-purple-500)",
  },
  sky: {
    solid: "bg-(--color-sky-500)",
    soft: "bg-(--color-sky-100)",
    text: "text-(--color-sky-600)",
    border: "border-(--color-sky-500)",
  },
} as const;

export type BrandColor = keyof typeof colorMap;
export function colorTokens(c: BrandColor) {
  return colorMap[c];
}

export function Card({
  children,
  className = "",
  padded = true,
  onClick,
  hoverLift = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  onClick?: () => void;
  hoverLift?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`rounded-(--radius-card) border-[3px] border-(--color-border) bg-(--color-surface) shadow-hard ${
        hoverLift || onClick ? "card-hover cursor-pointer" : ""
      } ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5 border-2",
    md: "px-4 py-2.5 text-sm gap-2 border-[3px]",
    lg: "px-5 py-3.5 text-base gap-2 border-[3px]",
  };
  const variants = {
    primary:
      "bg-(--color-orange-500) text-(--color-ink-on-accent) border-(--color-border) hover:bg-(--color-orange-400) disabled:bg-(--color-paper-dim) disabled:text-(--color-ink-muted)",
    secondary:
      "bg-(--color-surface) text-(--color-ink) border-(--color-border) hover:bg-(--color-paper-dim) disabled:bg-(--color-paper-dim) disabled:text-(--color-ink-muted)",
    ghost:
      "bg-transparent text-(--color-ink-soft) border-transparent hover:bg-(--color-paper-dim) shadow-none active:shadow-none disabled:text-(--color-ink-muted)",
    danger: "bg-(--color-danger) text-white border-(--color-border) hover:bg-(--color-danger)/85 disabled:bg-(--color-paper-dim) disabled:text-(--color-ink-muted)",
  };
  const shadow = variant === "ghost" ? "" : "shadow-hard-sm press-hard";
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${shadow} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  color = "orange",
  className = "",
}: {
  children: ReactNode;
  color?: BrandColor;
  className?: string;
}) {
  const t = colorTokens(color);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-(--color-border) px-2.5 py-1 text-xs font-bold text-(--color-ink-on-accent) ${t.solid} ${className}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  color = "orange",
  className = "",
  animated = true,
}: {
  value: number;
  max: number;
  color?: BrandColor;
  className?: string;
  animated?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const t = colorTokens(color);
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full border-2 border-(--color-border) bg-(--color-paper-dim) ${className}`}>
      <div
        className={`h-full rounded-full ${t.solid} ${animated ? "transition-[width] duration-700 ease-out" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  color = "orange",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  color?: BrandColor;
}) {
  const t = colorTokens(color);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-(--color-ink-muted)">
        {label}
      </span>
      <span className={`font-display text-3xl font-bold ${t.text}`}>{value}</span>
      {sub && <span className="text-xs font-semibold text-(--color-ink-muted)">{sub}</span>}
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hues = ["--color-orange-500", "--color-sky-500", "--color-lime-500", "--color-pink-500", "--color-purple-500"];
  const hue = hues[name.length % hues.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-(--color-border) font-bold text-(--color-ink-on-accent)"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `var(${hue})` }}
    >
      {initials}
    </div>
  );
}

const SMILEYS = ["😞", "😕", "😐", "🙂", "😄"];

export function SmileyScale({
  value,
  onChange,
  size = "md",
}: {
  value: number | null;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "text-base" : "text-2xl";
  return (
    <div className="flex gap-1">
      {SMILEYS.map((emoji, i) => {
        const v = i + 1;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange?.(v)}
            title={`${v}/5`}
            className={`${px} rounded-lg border-2 p-1 leading-none transition-transform hover:scale-110 ${
              active
                ? "border-(--color-border) bg-(--color-sky-100) shadow-hard-sm"
                : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border-[3px] border-dashed border-(--color-border) bg-(--color-paper-dim) px-6 py-12 text-center">
      {icon && <div className="text-(--color-ink-muted)">{icon}</div>}
      <div className="max-w-sm">
        <p className="font-display text-lg font-bold text-(--color-ink)">{title}</p>
        <p className="mt-1 text-sm font-medium text-(--color-ink-muted)">{body}</p>
      </div>
      {action}
    </div>
  );
}
