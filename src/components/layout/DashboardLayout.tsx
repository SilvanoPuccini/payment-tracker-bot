import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { PlanLimitBanner } from "@/components/subscription/PlanLimitBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Activate realtime notifications for authenticated users
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-pt-bg">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <Header />
        <main className="pt-page">
          <div className="gradient-glow fixed inset-0 pointer-events-none opacity-40" />
          <div className="relative z-10 px-4 py-5 pb-28 md:pb-6">
            <PlanLimitBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation with integrated FAB */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
