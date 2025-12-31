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
    if (!user) {
      console.error('completeOnboarding: No user logged in');
      return { error: new Error('No user logged in') };
    }

    console.log('completeOnboarding: Starting save for user:', user.id);
    console.log('completeOnboarding: Data to save:', data);

    try {
      // First, check if profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('completeOnboarding: Error checking profile:', selectError);
      }

      console.log('completeOnboarding: Existing profile:', existingProfile);

      // Update the profile
      const updateData = {
        company_name: data.businessName,
        currency: data.currency,
        timezone: data.timezone,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      console.log('completeOnboarding: Update data:', updateData);

      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('completeOnboarding: Supabase update error:', error);
        throw error;
      }

      console.log('completeOnboarding: Update successful:', updatedData);

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
