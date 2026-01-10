import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { PlanLimitBanner } from "@/components/subscription/PlanLimitBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Activate realtime notifications for authenticated users
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-[var(--pt-bg)]">
      {/* Desktop Sidebar - only on large screens */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header - different for mobile/desktop */}
        <Header />

        <main className="min-h-screen pb-24 lg:pb-6">
          {/* Ambient glow effect */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--pt-primary)]/5 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--pt-primary)]/5 rounded-full blur-3xl -ml-48 -mb-48" />
          </div>

          <div className="relative z-10 px-4 py-5">
            <PlanLimitBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - hidden on large screens */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}
