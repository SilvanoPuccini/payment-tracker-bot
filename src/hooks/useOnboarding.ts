import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'paytrack_onboarding_complete';

export interface OnboardingData {
  businessName: string;
  currency: string;
  timezone: string;
}

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setNeedsOnboarding(false);
      setIsLoading(false);
      return;
    }

    // Check localStorage first
    const localComplete = localStorage.getItem(ONBOARDING_KEY);
    if (localComplete === 'true') {
      setNeedsOnboarding(false);
      setIsLoading(false);
      return;
    }

    // Check profile for onboarding_completed field
    if (profile?.onboarding_completed) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setNeedsOnboarding(false);
      setIsLoading(false);
      return;
    }

    // If profile exists but no company_name, needs onboarding
    if (profile && !profile.company_name) {
      setNeedsOnboarding(true);
    } else if (profile?.company_name) {
      // Has company name, mark as complete
      setNeedsOnboarding(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } else {
      setNeedsOnboarding(true);
    }

    setIsLoading(false);
  }, [user, profile]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: data.businessName,
          currency: data.currency,
          timezone: data.timezone,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      localStorage.setItem(ONBOARDING_KEY, 'true');
      setNeedsOnboarding(false);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    isLoading,
    completeOnboarding,
    skipOnboarding,
  };
}
