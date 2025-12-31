import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

export function StatsCard({ title, value, change, changeType, icon: Icon, delay = 0 }: StatsCardProps) {
  return (
    <div
      className="stitch-card group relative overflow-hidden transition-all duration-300 hover:bg-stitch-surface-elevated hover:border-stitch-primary/30 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-stitch-primary/5 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stitch-muted">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-stitch-text tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5">
            {changeType === "positive" ? (
              <TrendingUp className="h-4 w-4 text-stitch-primary" />
            ) : changeType === "negative" ? (
              <TrendingDown className="h-4 w-4 text-stitch-red" />
            ) : null}
            <span
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-stitch-primary",
                changeType === "negative" && "text-stitch-red",
                changeType === "neutral" && "text-stitch-muted"
              )}
            >
              {change}
            </span>
            <span className="text-sm text-stitch-muted hidden sm:inline">vs mes anterior</span>
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stitch-primary/15 group-hover:bg-stitch-primary/25 transition-colors">
          <Icon className="h-6 w-6 text-stitch-primary" />
        </div>
      </div>
    </div>
  );
}
