import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboarding();

  // Show loading while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if onboarding already completed
  if (needsOnboarding === false) {
    return <Navigate to="/" replace />;
  }

  return <OnboardingFlow />;
}
