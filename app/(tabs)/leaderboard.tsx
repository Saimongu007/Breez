import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Trophy, Medal, Award, TrendingUp, User, Crown, RefreshCw } from 'lucide-react-native';
import { getLeaderboard, getUserRank, getUserAchievements, getAllAchievements, LeaderboardEntry, Achievement, UserAchievement } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [leaderboard, userRank, allAchievements, userAchievementsData] = await Promise.all([
        getLeaderboard(20), // Get top 20
        getUserRank(user.id),
        getAllAchievements(),
        getUserAchievements(user.id)
      ]);
      
      setLeaderboardData(leaderboard);
      setCurrentUserRank(userRank);
      setAchievements(allAchievements);
      setUserAchievements(userAchievementsData);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get current user data from leaderboard or create default
  const currentUser = leaderboardData.find(entry => entry.id === user?.id) || {
    id: user?.id || '',
    full_name: user?.user_metadata?.full_name || 'You',
    student_id: user?.user_metadata?.student_id || '',
    semester: user?.user_metadata?.semester || 1,
    total_coins: 0,
    uploaded_files_count: 0,
    downloaded_files_count: 0,
    coins_earned: 0,
    rank: currentUserRank
  };
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} color="#F59E0B" />;
      case 2:
        return <Medal size={20} color="#9CA3AF" />;
      case 3:
        return <Award size={20} color="#D97706" />;
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.firstPlace;
      case 2:
        return styles.secondPlace;
      case 3:
        return styles.thirdPlace;
      default:
        return styles.regularPlace;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.headerIcon}>
          <Trophy size={24} color="#F59E0B" />
        </View>
      </View>

      {/* Current User Position */}
      <View style={styles.currentUserCard}>
        <View style={styles.currentUserHeader}>
          <Text style={styles.currentUserTitle}>Your Position</Text>
          <Text style={styles.currentUserRank}>#{currentUser.rank || 'N/A'}</Text>
        </View>
        <View style={styles.currentUserStats}>
          <View style={styles.currentUserStat}>
            <Text style={styles.currentUserStatValue}>{currentUser.total_coins}</Text>
            <Text style={styles.currentUserStatLabel}>Coins</Text>
          </View>
          <View style={styles.currentUserStat}>
            <Text style={styles.currentUserStatValue}>{currentUser.uploaded_files_count}</Text>
            <Text style={styles.currentUserStatLabel}>Uploads</Text>
          </View>
          <View style={styles.currentUserStat}>
            <Text style={styles.currentUserStatValue}>{currentUser.downloaded_files_count}</Text>
            <Text style={styles.currentUserStatLabel}>Downloads</Text>
          </View>
        </View>
      </View>

      {/* Top Contributors */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.leaderboardList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboardData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leaderboard data available</Text>
          </View>
        ) : (
          leaderboardData.map((entry) => (
            <View key={entry.id} style={[styles.leaderboardItem, getRankStyle(entry.rank)]}>
              <View style={styles.rankContainer}>
                {getRankIcon(entry.rank)}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{entry.full_name}</Text>
                <Text style={styles.userUniversity}>ID: {entry.student_id}</Text>
              </View>
              
              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.total_coins}</Text>
                  <Text style={styles.statLabel}>coins</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.uploaded_files_count}</Text>
                  <Text style={styles.statLabel}>uploads</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Achievement Badges */}
      <View style={styles.achievementsSection}>
        <Text style={styles.achievementsTitle}>Achievement Badges</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesList}>
          <View style={styles.badge}>
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.badgeText}>Top Contributor</Text>
          </View>
          <View style={styles.badge}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.badgeText}>Rising Star</Text>
          </View>
          <View style={styles.badge}>
            <Award size={24} color="#8B5CF6" />
            <Text style={styles.badgeText}>Quality Creator</Text>
          </View>
          <View style={styles.badge}>
            <Medal size={24} color="#EF4444" />
            <Text style={styles.badgeText}>Super Sharer</Text>
          </View>
        </ScrollView>
      </View>
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
  headerIcon: {
    padding: 8,
  },
  currentUserCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentUserTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  currentUserRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  currentUserStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currentUserStat: {
    alignItems: 'center',
  },
  currentUserStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  currentUserStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  leaderboardList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  firstPlace: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  secondPlace: {
    backgroundColor: '#F8FAFC',
    borderColor: '#9CA3AF',
  },
  thirdPlace: {
    backgroundColor: '#FEF3E2',
    borderColor: '#D97706',
  },
  regularPlace: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userUniversity: {
    fontSize: 12,
    color: '#6B7280',
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  achievementsSection: {
    padding: 20,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
});