import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    console.log('AuthContext signOut: Starting...');
    try {
      // Clear local storage first - use correct key
      localStorage.removeItem('paytrack_onboarding_complete');
      localStorage.removeItem('onboarding_skipped');
      console.log('AuthContext signOut: localStorage cleared');

      // Clear state first
      setUser(null);
      setProfile(null);
      setSession(null);
      console.log('AuthContext signOut: State cleared');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext signOut: Supabase error:', error);
      } else {
        console.log('AuthContext signOut: Supabase signOut successful');
      }
    } catch (error) {
      console.error('AuthContext signOut: Caught error:', error);
      // Force clear state even if signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem('paytrack_onboarding_complete');
      localStorage.removeItem('onboarding_skipped');
    }
    console.log('AuthContext signOut: Complete');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('AuthContext updateProfile: Starting...');
    console.log('AuthContext updateProfile: Updates:', updates);

    if (!user) {
      console.error('AuthContext updateProfile: No user logged in');
      return { error: new Error('No user logged in') };
    }

    console.log('AuthContext updateProfile: User ID:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select();

      console.log('AuthContext updateProfile: Response data:', data);

      if (error) {
        console.error('AuthContext updateProfile: Supabase error:', error);
        return { error: new Error(error.message) };
      }

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      console.log('AuthContext updateProfile: Refreshed profile:', updatedProfile);
      setProfile(updatedProfile);

      return { error: null };
    } catch (error) {
      console.error('AuthContext updateProfile: Caught error:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
