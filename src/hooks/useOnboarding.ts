import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'paytrack_onboarding_complete';

export interface OnboardingData {
  businessName: string;
  currency: string;
  timezone: string;
}

export function useOnboarding() {
  const { user, profile, updateProfile } = useAuth();
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
    if (!user) {
      console.error('completeOnboarding: No user logged in');
      return { error: new Error('No user logged in') };
    }

    console.log('completeOnboarding: Starting save for user:', user.id);
    console.log('completeOnboarding: Data to save:', data);

    try {
      // Use updateProfile from AuthContext for consistency
      const { error } = await updateProfile({
        company_name: data.businessName,
        currency: data.currency,
        timezone: data.timezone,
        onboarding_completed: true,
      });

      if (error) {
        console.error('completeOnboarding: updateProfile error:', error);
        throw error;
      }

      console.log('completeOnboarding: Update successful');

      localStorage.setItem(ONBOARDING_KEY, 'true');
      setNeedsOnboarding(false);

      return { error: null };
    } catch (error) {
      console.error('completeOnboarding: Caught error:', error);
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
