import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Activate realtime notifications for authenticated users
  useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="gradient-glow fixed inset-0 pointer-events-none" />
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
