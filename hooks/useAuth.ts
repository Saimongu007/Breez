import { useState, useEffect, createContext, useContext } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Get environment variables for debugging
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_SESSION: '@breez_user_session',
  USER_DATA: '@breez_user_data',
  AUTH_STATE: '@breez_auth_state'
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, additionalData?: {
    fullName?: string;
    studentId?: string;
    semester?: string;
  }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to save auth state to AsyncStorage
  const saveAuthState = async (session: Session | null, user: User | null) => {
    try {
      if (session && user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
        console.log('✅ Auth state saved to AsyncStorage');
      } else {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER_SESSION,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.AUTH_STATE
        ]);
        console.log('🗑️ Auth state cleared from AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error saving auth state to AsyncStorage:', error);
    }
  };

  // Helper function to load auth state from AsyncStorage
  const loadAuthState = async () => {
    try {
      const authState = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      
      console.log('📱 AsyncStorage auth state:', {
        hasAuthState: !!authState,
        hasUserData: !!userData,
        hasSessionData: !!sessionData
      });

      return {
        authState,
        userData: userData ? JSON.parse(userData) : null,
        sessionData: sessionData ? JSON.parse(sessionData) : null
      };
    } catch (error) {
      console.error('❌ Error loading auth state from AsyncStorage:', error);
      return { authState: null, userData: null, sessionData: null };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Load cached auth state first
        const cachedAuth = await loadAuthState();
        if (cachedAuth.userData && mounted) {
          setUser(cachedAuth.userData);
          console.log('📱 Loaded cached user data');
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔐 Supabase session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message
        });

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Save to AsyncStorage
          await saveAuthState(session, session?.user ?? null);
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, {
        hasSession: !!session,
        hasUser: !!session?.user
      });

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Save to AsyncStorage
        await saveAuthState(session, session?.user ?? null);
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, additionalData?: {
    fullName?: string;
    studentId?: string;
    semester?: string;
  }) => {
    try {
      console.log('Attempting signup with:', {
        email,
        hasPassword: !!password,
        additionalData
      });

      // Check if Supabase is properly configured
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration missing:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        });
        return { error: { message: 'Supabase configuration is missing. Please check your environment variables.' } as AuthError };
      }

      // Include user metadata in signup
      const signUpData = {
        email,
        password,
        options: {
          data: {
            full_name: additionalData?.fullName || '',
            student_id: additionalData?.studentId || '',
            semester: additionalData?.semester || '1'
          }
        }
      };

      console.log('Signup payload:', signUpData);

      const { data, error } = await supabase.auth.signUp(signUpData);
      
      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      }

      return { error };
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return { error: { message: 'An unexpected error occurred during signup' } as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting signout process...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      console.log('🔄 Local auth state cleared');
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.AUTH_STATE
      ]);
      console.log('🗑️ AsyncStorage cleared during signout');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signout error:', error);
        // Don't return error here - we've already cleared local state
      } else {
        console.log('✅ Successfully signed out from Supabase');
      }

      // Always return success since we've cleared local state
      return { error: null };
    } catch (err) {
      console.error('❌ Unexpected signout error:', err);
      
      // Even if there's an error, ensure local state is cleared
      setUser(null);
      setSession(null);
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER_SESSION,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.AUTH_STATE
        ]);
      } catch (storageError) {
        console.error('❌ Error clearing AsyncStorage:', storageError);
      }
      
      // Return success since local state is cleared
      return { error: null };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

export { AuthContext };