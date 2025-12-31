import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { FAB } from "./FAB";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { PlanLimitBanner } from "@/components/subscription/PlanLimitBanner";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Activate realtime notifications for authenticated users
  useRealtimeNotifications();
  const location = useLocation();

  // Show FAB on certain pages
  const showFAB = ['/', '/payments', '/contacts'].includes(location.pathname);
  const fabDestination = location.pathname === '/contacts' ? '/contacts/new' : '/payments/new';

  return (
    <div className="min-h-screen bg-stitch-bg">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <Header />
        <main className="stitch-page">
          <div className="gradient-glow fixed inset-0 pointer-events-none opacity-50" />
          <div className="relative z-10 px-5 py-6 pb-28 md:pb-6">
            <PlanLimitBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
        {showFAB && <FAB to={fabDestination} />}
      </div>
    </div>
  );
}
