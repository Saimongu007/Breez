import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Linking } from 'react-native';
import { Search, Filter, FileText, Download, Coins, RefreshCw } from 'lucide-react-native';
import { getResources, getCategories, downloadResource, checkUserCoins, hasUserDownloaded, Resource, Category } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function DownloadScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    loadResources();
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [categoriesData, coinsData] = await Promise.all([
        getCategories(),
        checkUserCoins(user.id)
      ]);
      
      setCategories([{ id: 'all', name: 'All', description: '', icon: '', color: '', is_active: true, created_at: '' }, ...categoriesData]);
      setUserCoins(coinsData);
      
      await loadResources();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const filters: any = {};
      
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      if (selectedCategory && selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }
      
      const resourcesData = await getResources(filters);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDownload = async (resource: Resource) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to download resources');
      return;
    }

    // Check if user has enough coins
    if (userCoins < resource.coin_price) {
      Alert.alert('Insufficient Coins', `You need ${resource.coin_price} coins to download this resource. You have ${userCoins} coins.`);
      return;
    }

    // Check if user already downloaded this resource
    const alreadyDownloaded = await hasUserDownloaded(user.id, resource.id);
    if (alreadyDownloaded) {
      Alert.alert('Already Downloaded', 'You have already downloaded this resource.');
      return;
    }

    Alert.alert(
      'Download Resource',
      `Download "${resource.title}" for ${resource.coin_price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => performDownload(resource)
        }
      ]
    );
  };

  const performDownload = async (resource: Resource) => {
    if (!user) return;

    setDownloadingIds(prev => new Set(prev).add(resource.id));

    try {
      // Record the download in database
      const result = await downloadResource(resource.id, user.id, resource.coin_price);
      
      if (result.error) {
        Alert.alert('Download Failed', result.error.message || 'Failed to process download');
        return;
      }

      // Update user coins
      setUserCoins(prev => prev - resource.coin_price);

      // Get file URL and open it
      if (resource.file_url) {
        const { data } = supabase.storage
          .from('resources')
          .getPublicUrl(resource.file_url);
        
        if (data.publicUrl) {
          // Try to open the file
          const supported = await Linking.canOpenURL(data.publicUrl);
          if (supported) {
            await Linking.openURL(data.publicUrl);
          } else {
            Alert.alert('Download Complete', 'File downloaded successfully!');
          }
        }
      }

      Alert.alert('Success', `Downloaded ${resource.title}! ${resource.coin_price} coins deducted.`);
      
    } catch (error) {
      console.error('Error downloading resource:', error);
      Alert.alert('Error', 'An error occurred during download');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resource.id);
        return newSet;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Download Resources</Text>
        <View style={styles.coinsContainer}>
          <Coins size={20} color="#F59E0B" />
          <Text style={styles.coinsText}>{userCoins} coins</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.headerRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.name && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.name && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
          <RefreshCw size={20} color={refreshing ? '#9CA3AF' : '#2563EB'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resourcesList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading resources...</Text>
          </View>
        ) : resources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No resources found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
          </View>
        ) : (
          resources.map((resource) => (
            <View key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceAuthor}>by {resource.uploader_name || 'Unknown'}</Text>
                </View>
                <View style={styles.resourceType}>
                  <FileText size={16} color="#6B7280" />
                  <Text style={styles.resourceTypeText}>{resource.file_type}</Text>
                </View>
              </View>
              
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              
              <View style={styles.resourceFooter}>
                <View style={styles.resourceStats}>
                  <Text style={styles.resourceCategory}>{resource.category_name || 'Uncategorized'}</Text>
                  <Text style={styles.resourceDownloads}>{resource.download_count} downloads</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    (userCoins < resource.coin_price || downloadingIds.has(resource.id)) && styles.downloadButtonDisabled
                  ]}
                  onPress={() => handleDownload(resource)}
                  disabled={downloadingIds.has(resource.id)}
                >
                  <Coins size={16} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>
                    {downloadingIds.has(resource.id) ? '...' : resource.coin_price}
                  </Text>
                  <Download size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  resourcesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  resourceAuthor: {
    fontSize: 12,
    color: '#6B7280',
  },
  resourceType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceTypeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resourceDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceStats: {
    flex: 1,
  },
  resourceCategory: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  resourceDownloads: {
    fontSize: 12,
    color: '#6B7280',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
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
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});