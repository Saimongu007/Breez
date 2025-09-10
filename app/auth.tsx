import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Info, ArrowRight } from 'lucide-react-native';

export default function AuthScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Info size={48} color="#2563EB" />
          </View>
          <Text style={styles.title}>Demo Mode</Text>
          <Text style={styles.subtitle}>
            This is a frontend-only demo of the Breez+ academic resource sharing platform
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What you can explore:</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>• Upload interface with file type selection</Text>
            <Text style={styles.feature}>• Resource browsing and search functionality</Text>
            <Text style={styles.feature}>• User dashboard with statistics</Text>
            <Text style={styles.feature}>• Leaderboard with rankings and achievements</Text>
            <Text style={styles.feature}>• Settings and preferences management</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Explore Demo</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.note}>
          All data shown is mock data for demonstration purposes
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});