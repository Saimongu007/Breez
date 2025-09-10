# Breez+ API Documentation

## Overview

Breez+ is an academic resource sharing platform built with React Native/Expo and Supabase backend. This document outlines all API endpoints, database functions, and integration patterns used in the application.

## Architecture

- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

## Authentication API

### Sign Up
```typescript
// Function: signUp
// Location: hooks/useAuth.ts
const signUp = async (email: string, password: string, additionalData?: {
  fullName?: string;
  studentId?: string;
  semester?: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: additionalData?.fullName || '',
        student_id: additionalData?.studentId || '',
        semester: additionalData?.semester || '1'
      }
    }
  });
  return { error };
}
```

**Validation Rules:**
- Email must end with `@eastdelta.edu.bd`
- Password minimum 6 characters
- Student ID format: `EDU123456` (2-4 letters + 4-8 digits)
- Semester: 1-12

**Auto-triggered Actions:**
- Creates user profile in `user_profiles` table
- Creates default user settings
- Awards initial coins (if configured)

### Sign In
```typescript
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
}
```

### Sign Out
```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

## User Profile API

### Get User Profile
```typescript
// Function: getUserProfile
// Location: lib/database.ts
const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
```

**Response Schema:**
```typescript
interface UserProfile {
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
```

### Update User Profile
```typescript
const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}
```

## Resource Management API

### Get Resources (with filtering)
```typescript
const getResources = async (filters?: {
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

  // Apply filters
  if (filters?.category && filters.category !== 'All') {
    query = query.eq('categories.name', filters.category);
  }
  
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  return data || [];
}
```

**Resource Schema:**
```typescript
interface Resource {
  id: string;
  title: string;
  description: string;
  category_id: string;
  file_type: 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' | 'Image' | 'TXT';
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
```

### Upload Resource
```typescript
const uploadResource = async (resourceData: {
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
  return { data, error };
}
```

**Auto-triggered Actions:**
- Awards 10 coins to uploader
- Increments `uploaded_files_count`
- Records coin transaction
- Checks for achievements

### Get User Resources
```typescript
const getUserResources = async (userId: string): Promise<Resource[]> => {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      categories(name)
    `)
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}
```

## Download System API

### Download Resource
```typescript
const downloadResource = async (resourceId: string, downloaderId: string, coinsSpent: number) => {
  const { data, error } = await supabase
    .from('downloads')
    .insert([{
      resource_id: resourceId,
      downloader_id: downloaderId,
      coins_spent: coinsSpent
    }])
    .select()
    .single();
  return { data, error };
}
```

**Auto-triggered Actions:**
- Deducts coins from downloader
- Increments `downloaded_files_count`
- Increments resource `download_count`
- Records coin transaction
- Checks for achievements

### Check Download Status
```typescript
const hasUserDownloaded = async (userId: string, resourceId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('downloads')
    .select('id')
    .eq('downloader_id', userId)
    .eq('resource_id', resourceId)
    .single();
  return !!data;
}
```

### Get User Downloads
```typescript
const getUserDownloads = async (userId: string): Promise<Download[]> => {
  const { data, error } = await supabase
    .from('downloads')
    .select(`
      *,
      resources(title, categories(name))
    `)
    .eq('downloader_id', userId)
    .order('downloaded_at', { ascending: false });
  return data || [];
}
```

## Leaderboard API

### Get Leaderboard
```typescript
const getLeaderboard = async (limit: number = 50): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard') // Database view
    .select('*')
    .limit(limit);
  return data || [];
}
```

**Leaderboard Schema:**
```typescript
interface LeaderboardEntry {
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
```

### Get User Rank
```typescript
const getUserRank = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('id', userId)
    .single();
  return data?.rank || 0;
}
```

## Coin System API

### Check User Coins
```typescript
const checkUserCoins = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('total_coins')
    .eq('id', userId)
    .single();
  return data?.total_coins || 0;
}
```

### Get Coin Transactions
```typescript
const getCoinTransactions = async (userId: string, limit: number = 20): Promise<CoinTransaction[]> => {
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
```

**Transaction Schema:**
```typescript
interface CoinTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  reference_id: string;
  reference_type: 'upload' | 'download' | 'bonus' | 'penalty';
  created_at: string;
}
```

## Achievement System API

### Get User Achievements
```typescript
const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  return data || [];
}
```

### Get All Achievements
```typescript
const getAllAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('requirement_value');
  return data || [];
}
```

**Achievement Schema:**
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: 'uploads' | 'downloads' | 'coins_earned' | 'coins_spent';
  requirement_value: number;
  is_active: boolean;
  created_at: string;
}
```

## Categories API

### Get Categories
```typescript
const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');
  return data || [];
}
```

**Category Schema:**
```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}
```

## File Storage API

### Upload File
```typescript
const uploadFile = async (file: any): Promise<string | null> => {
  const fileExt = file.name?.split('.').pop() || 'unknown';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('resources')
    .upload(fileName, blob, {
      contentType: file.mimeType || 'application/octet-stream',
      upsert: false
    });

  return data?.path || null;
}
```

### Get File URL
```typescript
const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('resources')
    .getPublicUrl(filePath);
  return data.publicUrl;
}
```

## Settings API

### Get User Settings
```typescript
const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}
```

### Update User Settings
```typescript
const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error };
}
```

## Real-time Subscriptions

### Subscribe to Profile Changes
```typescript
const subscribeToUserProfile = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('user_profile_changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_profiles',
      filter: `id=eq.${userId}`
    }, callback)
    .subscribe();
}
```

### Subscribe to Leaderboard Changes
```typescript
const subscribeToLeaderboard = (callback: (payload: any) => void) => {
  return supabase
    .channel('leaderboard_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_profiles'
    }, callback)
    .subscribe();
}
```

## Search API

### Search Resources
```typescript
const searchResources = async (query: string, filters?: {
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

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
  }

  return data || [];
}
```

## Error Handling

All API functions return a consistent error format:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
}
```

## Rate Limiting

Supabase provides built-in rate limiting:
- **Auth endpoints**: 30 requests per hour per IP
- **Database queries**: 200 requests per minute per user
- **Storage uploads**: 100 requests per minute per user

## Security

### Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only access their own data
- Only approved resources are visible
- Proper authentication is required

### API Key Security
- Use `EXPO_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- Never expose service role key in client code
- Environment variables are properly configured

## Pricing Calculation

### Coin Price Algorithm
```typescript
const calculateCoinPrice = (fileType: string, fileSize?: number): number => {
  let basePrice = 3;
  
  switch (fileType.toUpperCase()) {
    case 'PDF': basePrice = 5; break;
    case 'DOC':
    case 'DOCX': basePrice = 4; break;
    case 'IMAGE': basePrice = 3; break;
    default: basePrice = 3;
  }

  if (fileSize) {
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > 10) basePrice += 2;
    else if (sizeInMB > 5) basePrice += 1;
  }

  return Math.max(basePrice, 2);
}
```

## Environment Configuration

Required environment variables:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Endpoints Summary

| Feature | Method | Endpoint/Function | Description |
|---------|--------|-------------------|-------------|
| Auth | POST | `supabase.auth.signUp()` | User registration |
| Auth | POST | `supabase.auth.signInWithPassword()` | User login |
| Auth | POST | `supabase.auth.signOut()` | User logout |
| Profile | GET | `getUserProfile(userId)` | Get user profile |
| Profile | PUT | `updateUserProfile(userId, updates)` | Update profile |
| Resources | GET | `getResources(filters)` | List resources |
| Resources | POST | `uploadResource(data)` | Upload new resource |
| Resources | GET | `getUserResources(userId)` | User's uploads |
| Downloads | POST | `downloadResource(resourceId, userId, coins)` | Download resource |
| Downloads | GET | `getUserDownloads(userId)` | User's downloads |
| Downloads | GET | `hasUserDownloaded(userId, resourceId)` | Check download status |
| Leaderboard | GET | `getLeaderboard(limit)` | Get rankings |
| Leaderboard | GET | `getUserRank(userId)` | Get user rank |
| Coins | GET | `checkUserCoins(userId)` | Get coin balance |
| Coins | GET | `getCoinTransactions(userId)` | Get transaction history |
| Achievements | GET | `getUserAchievements(userId)` | User achievements |
| Achievements | GET | `getAllAchievements()` | All achievements |
| Categories | GET | `getCategories()` | List categories |
| Settings | GET | `getUserSettings(userId)` | Get user settings |
| Settings | PUT | `updateUserSettings(userId, settings)` | Update settings |
| Storage | POST | `supabase.storage.upload()` | Upload file |
| Storage | GET | `supabase.storage.getPublicUrl()` | Get file URL |

This API documentation covers all the endpoints and functions used in the Breez+ platform, providing a complete reference for developers working with the system.