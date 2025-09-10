import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { User, FileText, Download, Coins, TrendingUp, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getUserProfile, getUserResources, getUserDownloads, getCoinTransactions, UserProfile, Resource, Download as DownloadType, CoinTransaction } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentUploads, setRecentUploads] = useState<Resource[]>([]);
  const [recentDownloads, setRecentDownloads] = useState<DownloadType[]>([]);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [profile, uploads, downloads, transactions] = await Promise.all([
        getUserProfile(user.id),
        getUserResources(user.id),
        getUserDownloads(user.id),
        getCoinTransactions(user.id, 10)
      ]);
      
      setUserProfile(profile);
      setRecentUploads(uploads.slice(0, 3)); // Get latest 3
      setRecentDownloads(downloads.slice(0, 3)); // Get latest 3
      setCoinTransactions(transactions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Removed navigateToSettings since Settings is now a separate tab

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (!user || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile.full_name}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color="#2563EB" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.full_name}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
              <Text style={styles.profileId}>Student ID: {userProfile.student_id}</Text>
              <Text style={styles.profileSemester}>Semester: {userProfile.semester}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <Text style={styles.joinDate}>Member since {formatJoinDate(userProfile.created_at)}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Coins size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{userProfile.total_coins}</Text>
            <Text style={styles.statLabel}>Total Coins</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{userProfile.coins_earned}</Text>
            <Text style={styles.statLabel}>Coins Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <FileText size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{userProfile.uploaded_files_count}</Text>
            <Text style={styles.statLabel}>Uploaded</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Download size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{userProfile.downloaded_files_count}</Text>
            <Text style={styles.statLabel}>Downloaded</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
          {recentUploads.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No uploads yet</Text>
            </View>
          ) : (
            recentUploads.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityCategory}>{item.category_name || 'Uncategorized'}</Text>
                </View>
                <View style={styles.activityMeta}>
                  <View style={styles.coinsEarned}>
                    <Coins size={12} color="#10B981" />
                    <Text style={styles.coinsEarnedText}>+10</Text>
                  </View>
                  <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Downloads</Text>
          {recentDownloads.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No downloads yet</Text>
            </View>
          ) : (
            recentDownloads.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.resource_title || 'Unknown Resource'}</Text>
                  <Text style={styles.activityCategory}>{item.resource_category || 'Uncategorized'}</Text>
                </View>
                <View style={styles.activityMeta}>
                  <View style={styles.coinsSpent}>
                    <Coins size={12} color="#EF4444" />
                    <Text style={styles.coinsSpentText}>-{item.coins_spent}</Text>
                  </View>
                  <Text style={styles.activityDate}>{formatDate(item.downloaded_at)}</Text>
                </View>
              </View>
            ))
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  profileSemester: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  profileStats: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  joinDate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityCategory: {
    fontSize: 12,
    color: '#059669',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  coinsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  coinsEarnedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  coinsSpent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  coinsSpentText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});