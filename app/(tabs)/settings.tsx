import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { User, Mail, GraduationCap, Bell, Moon, Globe, Eye, CircleHelp as HelpCircle, Info, ChevronRight, Save, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface UserSettings {
  name: string;
  email: string;
  studentId: string;
  semester: string;
  notifications: {
    push: boolean;
    email: boolean;
    downloads: boolean;
    uploads: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showStats: boolean;
    allowMessages: boolean;
  };
  preferences: {
    darkMode: boolean;
    language: string;
    autoDownload: boolean;
  };
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    name: user?.user_metadata?.full_name || 'John Doe',
    email: user?.email || 'john.doe@eastdelta.edu.bd',
    studentId: 'EDU123456',
    semester: '7',
    notifications: {
      push: true,
      email: true,
      downloads: true,
      uploads: false,
    },
    privacy: {
      profileVisible: true,
      showStats: true,
      allowMessages: true,
    },
    preferences: {
      darkMode: false,
      language: 'English',
      autoDownload: false,
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const updateProfileField = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    // In a real app, this would save to backend/storage
    Alert.alert('Settings Saved', 'Your preferences have been updated successfully.', [
      { text: 'OK', onPress: () => {
        setHasUnsavedChanges(false);
        setIsEditing(false);
      }}
    ]);
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          // Reset to default values
          setHasUnsavedChanges(false);
          setIsEditing(false);
        }}
      ]
    );
  };

  const handleLogout = () => {
    console.log('🔘 Sign Out button pressed');
    
    // Since Alert doesn't work in web environment, use window.confirm as fallback
    const confirmed = window.confirm('Are you sure you want to sign out?');
    
    if (confirmed) {
      console.log('✅ Logout confirmed');
      performLogout();
    } else {
      console.log('❌ Logout cancelled');
    }
  };

  const performLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      const { error } = await signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
        return;
      }
      
      console.log('✅ Logout successful');
      
      // Clear local state
      setSettings({
        name: '',
        email: '',
        studentId: '',
        semester: '',
        notifications: {
          push: true,
          email: true,
          downloads: true,
          uploads: false,
        },
        privacy: {
          profileVisible: true,
          showStats: true,
          allowMessages: true,
        },
        preferences: {
          darkMode: false,
          language: 'English',
          autoDownload: false,
        },
      });
      
      // Navigate to login
      console.log('🔄 Redirecting to login...');
      router.replace('/login');
      
    } catch (error) {
      console.error('❌ Unexpected logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred during sign out');
      
      // Force logout even if there's an error
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {hasUnsavedChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User size={32} color="#2563EB" />
            </View>
            
            <View style={styles.profileFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <User size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={settings.name}
                    onChangeText={(value) => updateProfileField('name', value)}
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={settings.email}
                    onChangeText={(value) => updateProfileField('email', value)}
                    editable={isEditing}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID</Text>
                <View style={styles.inputContainer}>
                  <GraduationCap size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={settings.studentId}
                    onChangeText={(value) => updateProfileField('studentId', value)}
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Semester</Text>
                <View style={styles.inputContainer}>
                  <GraduationCap size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={settings.semester}
                    onChangeText={(value) => updateProfileField('semester', value)}
                    editable={isEditing}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive notifications on your device</Text>
                </View>
              </View>
              <Switch
                value={settings.notifications.push}
                onValueChange={(value) => updateSetting('notifications', 'push', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Mail size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>Receive updates via email</Text>
                </View>
              </View>
              <Switch
                value={settings.notifications.email}
                onValueChange={(value) => updateSetting('notifications', 'email', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Download Notifications</Text>
                  <Text style={styles.settingDescription}>Notify when files are downloaded</Text>
                </View>
              </View>
              <Switch
                value={settings.notifications.downloads}
                onValueChange={(value) => updateSetting('notifications', 'downloads', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Upload Notifications</Text>
                  <Text style={styles.settingDescription}>Notify about upload status</Text>
                </View>
              </View>
              <Switch
                value={settings.notifications.uploads}
                onValueChange={(value) => updateSetting('notifications', 'uploads', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Eye size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Profile Visibility</Text>
                  <Text style={styles.settingDescription}>Make your profile visible to others</Text>
                </View>
              </View>
              <Switch
                value={settings.privacy.profileVisible}
                onValueChange={(value) => updateSetting('privacy', 'profileVisible', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Show Statistics</Text>
                  <Text style={styles.settingDescription}>Display your stats on leaderboard</Text>
                </View>
              </View>
              <Switch
                value={settings.privacy.showStats}
                onValueChange={(value) => updateSetting('privacy', 'showStats', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Demo Mode</Text>
                  <Text style={styles.settingDescription}>This is a frontend-only demo</Text>
                </View>
              </View>
              <Info size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Moon size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>Use dark theme</Text>
                </View>
              </View>
              <Switch
                value={settings.preferences.darkMode}
                onValueChange={(value) => updateSetting('preferences', 'darkMode', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Globe size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Language</Text>
                  <Text style={styles.settingDescription}>{settings.preferences.language}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Auto Download</Text>
                  <Text style={styles.settingDescription}>Automatically download purchased files</Text>
                </View>
              </View>
              <Switch
                value={settings.preferences.autoDownload}
                onValueChange={(value) => updateSetting('preferences', 'autoDownload', value)}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Support & About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & About</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <HelpCircle size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Help & Support</Text>
                  <Text style={styles.settingDescription}>Get help and contact support</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Info size={20} color="#2563EB" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>About Breez+</Text>
                  <Text style={styles.settingDescription}>Version 1.0.0</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
            testID="logout-button"
          >
            <LogOut size={16} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileFields: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionSection: {
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});