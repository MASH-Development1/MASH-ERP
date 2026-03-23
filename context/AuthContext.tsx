'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  const supabase = createClient();

  useEffect(() => {
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
        console.error('Error fetching profile details:', JSON.stringify(error, null, 2));
        console.error('Raw profile error:', error);
        
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
          setProfile(null);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        lastFetchedUserId = null;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
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
