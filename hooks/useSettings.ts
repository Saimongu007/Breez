import { useState, useEffect } from 'react';

export interface UserSettings {
  name: string;
  email: string;
  universityId: string;
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

const DEFAULT_SETTINGS: UserSettings = {
  name: 'John Doe',
  email: 'john.doe@university.edu',
  universityId: 'STU123456',
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
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In demo mode, settings are not persisted
      // You could implement localStorage for web or AsyncStorage for mobile here
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings?: UserSettings) => {
    try {
      // In demo mode, settings are not persisted
      // You could implement localStorage for web or AsyncStorage for mobile here
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

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

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    hasUnsavedChanges,
    updateSetting,
    updateProfileField,
    saveSettings,
    resetSettings,
    loadSettings,
  };
}