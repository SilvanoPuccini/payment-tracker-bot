import { createContext, useContext, useState, ReactNode } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  status: string; // "all" | "confirmed" | "detected" | "rejected"
  minAmount: number | null;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  applyPreset: (preset: string) => void;
}

const getDefaultFilters = (): DashboardFilters => ({
  startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  status: "all",
  minAmount: null,
});

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(getDefaultFilters);

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(getDefaultFilters());
  };

  const applyPreset = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (preset) {
      case "today":
        startDate = today;
        break;
      case "7d":
        startDate = subDays(today, 7);
        break;
      case "30d":
        startDate = subDays(today, 30);
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(subDays(startOfMonth(today), 1));
        endDate = endOfMonth(subDays(startOfMonth(today), 1));
        break;
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }));
  };

  return (
    <DashboardFilterContext.Provider
      value={{ filters, setFilters, updateFilter, resetFilters, applyPreset }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error("useDashboardFilters must be used within a DashboardFilterProvider");
  }
  return context;
}
