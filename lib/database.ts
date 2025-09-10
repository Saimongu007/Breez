import { supabase } from './supabase';

// =====================================================
// USER PROFILE FUNCTIONS
// =====================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  semester: number;
  total_coins: number;
  coins_earned: number;
  coins_spent: number;
  uploaded_files_count: number;
  downloaded_files_count: number;
  profile_visible: boolean;
  show_stats: boolean;
  allow_messages: boolean;
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// =====================================================
// CATEGORIES FUNCTIONS
// =====================================================

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
};

// =====================================================
// RESOURCES FUNCTIONS
// =====================================================

export interface Resource {
  id: string;
  title: string;
  description: string;
  category_id: string;
  file_type: string;
  file_url: string;
  file_size: number;
  coin_price: number;
  uploader_id: string;
  download_count: number;
  is_approved: boolean;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  uploader_name?: string;
  uploader_student_id?: string;
}

export const getResources = async (filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Resource[]> => {
  let query = supabase
    .from('resources')
    .select(`
      *,
      categories(name),
      user_profiles(full_name, student_id)
    `)
    .eq('is_approved', true)
    .eq('is_active', true);

  if (filters?.category && filters.category !== 'All') {
    query = query.eq('categories.name', filters.category);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('download_count', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }

  return data?.map(item => ({
    ...item,
    category_name: item.categories?.name,
    uploader_name: item.user_profiles?.full_name,
    uploader_student_id: item.user_profiles?.student_id,
  })) || [];
};

export const uploadResource = async (resourceData: {
  title: string;
  description: string;
  category_id: string;
  file_type: string;
  file_url?: string;
  file_size?: number;
  coin_price: number;
  uploader_id: string;
  is_approved?: boolean;
  tags?: string[];
}) => {
  const { data, error } = await supabase
    .from('resources')
    .insert([resourceData])
    .select()
    .single();

  if (error) {
    console.error('Error uploading resource:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getUserResources = async (userId: string): Promise<Resource[]> => {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      categories(name)
    `)
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user resources:', error);
    return [];
  }

  return data?.map(item => ({
    ...item,
    category_name: item.categories?.name,
  })) || [];
};

// =====================================================
// DOWNLOADS FUNCTIONS
// =====================================================

export interface Download {
  id: string;
  resource_id: string;
  downloader_id: string;
  coins_spent: number;
  downloaded_at: string;
  // Joined fields
  resource_title?: string;
  resource_category?: string;
}

export const downloadResource = async (resourceId: string, downloaderId: string, coinsSpent: number) => {
  const { data, error } = await supabase
    .from('downloads')
    .insert([{
      resource_id: resourceId,
      downloader_id: downloaderId,
      coins_spent: coinsSpent
    }])
    .select()
    .single();

  if (error) {
    console.error('Error recording download:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

export const getUserDownloads = async (userId: string): Promise<Download[]> => {
  const { data, error } = await supabase
    .from('downloads')
    .select(`
      *,
      resources(title, categories(name))
    `)
    .eq('downloader_id', userId)
    .order('downloaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching user downloads:', error);
    return [];
  }

  return data?.map(item => ({
    ...item,
    resource_title: item.resources?.title,
    resource_category: item.resources?.categories?.name,
  })) || [];
};

export const hasUserDownloaded = async (userId: string, resourceId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('downloads')
    .select('id')
    .eq('downloader_id', userId)
    .eq('resource_id', resourceId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking download status:', error);
    return false;
  }

  return !!data;
};

// =====================================================
// LEADERBOARD FUNCTIONS
// =====================================================

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  student_id: string;
  semester: number;
  total_coins: number;
  uploaded_files_count: number;
  downloaded_files_count: number;
  coins_earned: number;
  rank: number;
}

export const getLeaderboard = async (limit: number = 50): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
};

export const getUserRank = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user rank:', error);
    return 0;
  }

  return data?.rank || 0;
};

// =====================================================
// COIN TRANSACTIONS FUNCTIONS
// =====================================================

export interface CoinTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  reference_id: string;
  reference_type: 'upload' | 'download' | 'bonus' | 'penalty';
  created_at: string;
}

export const getCoinTransactions = async (userId: string, limit: number = 20): Promise<CoinTransaction[]> => {
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching coin transactions:', error);
    return [];
  }

  return data || [];
};

// =====================================================
// ACHIEVEMENTS FUNCTIONS
// =====================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data?.map(item => ({
    ...item,
    achievement: item.achievements,
  })) || [];
};

export const getAllAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('requirement_value');

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
};

// =====================================================
// USER SETTINGS FUNCTIONS
// =====================================================

export interface UserSettings {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  download_notifications: boolean;
  upload_notifications: boolean;
  profile_visible: boolean;
  show_stats: boolean;
  allow_messages: boolean;
  dark_mode: boolean;
  language: string;
  auto_download: boolean;
  created_at: string;
  updated_at: string;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user settings:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const checkUserCoins = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('total_coins')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking user coins:', error);
    return 0;
  }

  return data?.total_coins || 0;
};

export const searchResources = async (query: string, filters?: {
  category?: string;
  fileType?: string;
  limit?: number;
}): Promise<Resource[]> => {
  let dbQuery = supabase
    .from('resources')
    .select(`
      *,
      categories(name),
      user_profiles(full_name, student_id)
    `)
    .eq('is_approved', true)
    .eq('is_active', true);

  // Add search conditions
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
  }

  if (filters?.category && filters.category !== 'All') {
    dbQuery = dbQuery.eq('categories.name', filters.category);
  }

  if (filters?.fileType) {
    dbQuery = dbQuery.eq('file_type', filters.fileType);
  }

  if (filters?.limit) {
    dbQuery = dbQuery.limit(filters.limit);
  }

  dbQuery = dbQuery.order('download_count', { ascending: false });

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Error searching resources:', error);
    return [];
  }

  return data?.map(item => ({
    ...item,
    category_name: item.categories?.name,
    uploader_name: item.user_profiles?.full_name,
    uploader_student_id: item.user_profiles?.student_id,
  })) || [];
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export const subscribeToUserProfile = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('user_profile_changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_profiles',
      filter: `id=eq.${userId}`
    }, callback)
    .subscribe();
};

export const subscribeToLeaderboard = (callback: (payload: any) => void) => {
  return supabase
    .channel('leaderboard_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_profiles'
    }, callback)
    .subscribe();
};