import { clsx } from "clsx";

// ── Glass Card ──────────────────────────────────────────────
export function GlassCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "glass-card",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────────
export function StatusBadge({ status }: { status: "Toxic" | "Neutral" | "Review" }) {
  const map = {
    Toxic: { cls: "status-toxic", dot: "bg-neon-red", label: "Toxic" },
    Neutral: { cls: "status-neutral", dot: "bg-neon-green", label: "Neutral" },
    Review: { cls: "status-review", dot: "bg-neon-amber", label: "Review" },
  };
  const { cls, dot, label } = map[status];
  return (
    <span className={`status-badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse-soft`} />
      {label}
    </span>
  );
}

// ── Toxicity Bar ─────────────────────────────────────────────
export function ToxicityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score > 0.85 ? "#ff2d55" : score > 0.5 ? "#ffb800" : "#00ff94";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-text-secondary w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ── Stat Chip ────────────────────────────────────────────────
export function StatChip({
  label,
  value,
  color = "cyan",
}: {
  label: string;
  value: number | string;
  color?: "cyan" | "red" | "amber" | "green";
}) {
  const colorMap = {
    cyan: "text-neon-cyan",
    red: "text-neon-red",
    amber: "text-neon-amber",
    green: "text-neon-green",
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xl font-display font-bold ${colorMap[color]}`}>
        {value}
      </span>
      <span className="text-xs text-text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── Glow Button ──────────────────────────────────────────────
export function GlowButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "ghost";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-glow",
    danger:
      "bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20 hover:shadow-glow-red",
    ghost:
      "bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/8",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "glow-btn",
        variants[variant],
        disabled && "opacity-40 pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-lg bg-gradient-to-r from-white/3 via-white/6 to-white/3",
        "bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

// ── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-text-muted opacity-40 text-5xl">{icon}</div>
      <h3 className="font-display text-lg text-text-secondary">{title}</h3>
      {subtitle && <p className="text-sm text-text-muted max-w-xs">{subtitle}</p>}
    </div>
  );
}
