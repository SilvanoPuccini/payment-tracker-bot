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
      className="group relative overflow-hidden rounded-xl bg-card border border-border p-6 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/30 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5">
            {changeType === "positive" ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : changeType === "negative" ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : null}
            <span
              className={cn(
                "text-sm font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
            <span className="text-sm text-muted-foreground">vs mes anterior</span>
          </div>
        </div>
        
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
