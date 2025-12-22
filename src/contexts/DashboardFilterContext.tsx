import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const STORAGE_KEY = "paytrack_dashboard_filters";

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  status: string; // "all" | "confirmed" | "detected" | "rejected"
  minAmount: number | null;
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: DashboardFilters;
  createdAt: string;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  applyPreset: (preset: string) => void;
  // Persistence methods
  saveCurrentFilters: (name: string) => void;
  savedPresets: SavedFilterPreset[];
  loadSavedPreset: (id: string) => void;
  deleteSavedPreset: (id: string) => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

const getDefaultFilters = (): DashboardFilters => ({
  startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  status: "all",
  minAmount: null,
});

// Load filters from localStorage
const loadStoredFilters = (): { filters: DashboardFilters; presets: SavedFilterPreset[]; autoSave: boolean } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        filters: parsed.autoSave && parsed.lastFilters ? parsed.lastFilters : getDefaultFilters(),
        presets: parsed.presets || [],
        autoSave: parsed.autoSave ?? false,
      };
    }
  } catch (e) {
    console.error("Error loading stored filters:", e);
  }
  return { filters: getDefaultFilters(), presets: [], autoSave: false };
};

// Save to localStorage
const saveToStorage = (filters: DashboardFilters, presets: SavedFilterPreset[], autoSave: boolean) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lastFilters: filters,
        presets,
        autoSave,
      })
    );
  } catch (e) {
    console.error("Error saving filters:", e);
  }
};

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredFilters();
  const [filters, setFiltersState] = useState<DashboardFilters>(stored.filters);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(stored.presets);
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(stored.autoSave);

  // Auto-save filters when they change (if enabled)
  useEffect(() => {
    if (autoSaveEnabled) {
      saveToStorage(filters, savedPresets, autoSaveEnabled);
    }
  }, [filters, autoSaveEnabled, savedPresets]);

  const setFilters = (newFilters: DashboardFilters) => {
    setFiltersState(newFilters);
  };

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFiltersState(getDefaultFilters());
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

    setFiltersState((prev) => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }));
  };

  // Save current filters as a named preset
  const saveCurrentFilters = (name: string) => {
    const newPreset: SavedFilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    saveToStorage(filters, updated, autoSaveEnabled);
  };

  // Load a saved preset
  const loadSavedPreset = (id: string) => {
    const preset = savedPresets.find((p) => p.id === id);
    if (preset) {
      setFiltersState(preset.filters);
    }
  };

  // Delete a saved preset
  const deleteSavedPreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    saveToStorage(filters, updated, autoSaveEnabled);
  };

  // Toggle auto-save
  const setAutoSaveEnabled = (enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    saveToStorage(filters, savedPresets, enabled);
  };

  return (
    <DashboardFilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        applyPreset,
        saveCurrentFilters,
        savedPresets,
        loadSavedPreset,
        deleteSavedPreset,
        autoSaveEnabled,
        setAutoSaveEnabled,
      }}
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
