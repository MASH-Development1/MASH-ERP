'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  avatar_url?: string;
  phone?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();
    let lastFetchedUserId: string | null = null;

    const fetchProfile = async (userId: string) => {
      if (lastFetchedUserId === userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data) {
          setProfile(data);
          lastFetchedUserId = userId;
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error?.message || error);
        if (error.code === 'PGRST116') {
          setProfile(null);
        }
      }
    };

    // Use getSession() for instant client-side hydration.
    // This is safe because the proxy (proxy.ts) already validated the token
    // server-side with getUser() BEFORE this page even loaded.
    // If the token was invalid, the proxy would have redirected to /auth/login
    // and cleared the cookies — so we'd never reach this code with stale tokens.
    const initializeAuth = async (retries = 3) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Session read failed, clearing:', error.message);
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          setUser(null);
          setProfile(null);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false); // Instantly unblock rendering
        
        if (currentUser) {
          fetchProfile(currentUser.id); // Background fetch
        }
      } catch (error: any) {
        if (error.name === 'NavigatorLockAcquireTimeoutError' && retries > 0) {
          console.warn(`Auth lock timeout, retrying... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return initializeAuth(retries - 1);
        }
        console.error('Auth initialization error:', error);
        // On unexpected error, sign out to prevent stuck loading state
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        setUser(null);
        setProfile(null);
      } finally {
        // Ensure loading is resolved even on error
        setLoading(false);
      }
    };

    initializeAuth();

    // onAuthStateChange handles ongoing session management:
    // - TOKEN_REFRESHED: token was auto-refreshed before expiry
    // - SIGNED_OUT: user logged out or token refresh failed
    // - SIGNED_IN: user just logged in
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false); // Instantly unblock rendering

      if (currentUser) {
        fetchProfile(currentUser.id); // Background fetch
      } else {
        setProfile(null);
        lastFetchedUserId = null;
      }

      // If loading is still true (e.g. race with initializeAuth), resolve it
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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
