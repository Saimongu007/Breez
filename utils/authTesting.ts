import AsyncStorage from '@react-native-async-storage/async-storage';

// Testing utilities for authentication system
export const AuthTesting = {
  // Check AsyncStorage contents
  async checkAsyncStorage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const breezKeys = keys.filter(key => key.startsWith('@breez_'));
      
      console.log('📱 AsyncStorage Breez+ keys:', breezKeys);
      
      const values = await AsyncStorage.multiGet(breezKeys);
      const storage = values.reduce((acc, [key, value]) => {
        acc[key] = value ? JSON.parse(value) : null;
        return acc;
      }, {} as Record<string, any>);
      
      console.log('📱 AsyncStorage contents:', storage);
      return storage;
    } catch (error) {
      console.error('❌ Error checking AsyncStorage:', error);
      return {};
    }
  },

  // Clear all auth data
  async clearAllAuthData() {
    try {
      const keys = [
        '@breez_user_session',
        '@breez_user_data',
        '@breez_auth_state'
      ];
      await AsyncStorage.multiRemove(keys);
      console.log('🗑️ All auth data cleared from AsyncStorage');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  },

  // Test environment variables
  checkEnvironmentVariables() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔧 Environment Variables Check:', {
      hasUrl: !!supabaseUrl,
      urlFormat: supabaseUrl ? (supabaseUrl.includes('supabase.co') ? '✅ Valid' : '❌ Invalid') : '❌ Missing',
      hasKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
      keyFormat: supabaseAnonKey ? (supabaseAnonKey.length > 100 ? '✅ Valid length' : '❌ Too short') : '❌ Missing'
    });
    
    return {
      isValid: !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.includes('supabase.co'),
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey
    };
  },

  // Test signup data validation
  testSignupData(email: string, password: string, additionalData?: any) {
    console.log('🧪 Testing signup data:', {
      email: {
        value: email,
        isEduEmail: email.endsWith('@eastdelta.edu.bd'),
        hasAtSymbol: email.includes('@'),
        length: email.length
      },
      password: {
        length: password.length,
        hasMinLength: password.length >= 6,
        isNotEmpty: password.length > 0
      },
      additionalData: {
        hasFullName: !!additionalData?.fullName,
        hasStudentId: !!additionalData?.studentId,
        hasSemester: !!additionalData?.semester,
        fullData: additionalData
      }
    });
  }
};

// Global testing functions (can be called from browser console)
if (typeof window !== 'undefined') {
  (window as any).AuthTesting = AuthTesting;
}