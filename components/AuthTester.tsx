import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthTesting } from '@/utils/authTesting';

export const AuthTester = () => {
  const { user, session, loading, signOut } = useAuth();
  const [testResults, setTestResults] = useState<string>('');

  const addTestResult = (result: string) => {
    setTestResults(prev => prev + '\n' + result);
    console.log(result);
  };

  const runEnvironmentTest = () => {
    addTestResult('🔧 Testing Environment Variables...');
    const envCheck = AuthTesting.checkEnvironmentVariables();
    addTestResult(`Environment Status: ${envCheck.isValid ? '✅ Valid' : '❌ Invalid'}`);
  };

  const runAsyncStorageTest = async () => {
    addTestResult('📱 Testing AsyncStorage...');
    const storage = await AuthTesting.checkAsyncStorage();
    addTestResult(`AsyncStorage Keys: ${Object.keys(storage).length}`);
    addTestResult(`Has Auth Data: ${Object.keys(storage).length > 0 ? '✅ Yes' : '❌ No'}`);
  };

  const runSignoutTest = async () => {
    addTestResult('🚪 Testing Signout...');
    try {
      const { error } = await signOut();
      if (error) {
        addTestResult(`❌ Signout Error: ${error.message}`);
      } else {
        addTestResult('✅ Signout Successful');
        // Check if AsyncStorage was cleared
        setTimeout(async () => {
          const storage = await AuthTesting.checkAsyncStorage();
          addTestResult(`AsyncStorage after signout: ${Object.keys(storage).length === 0 ? '✅ Cleared' : '❌ Not cleared'}`);
        }, 1000);
      }
    } catch (error) {
      addTestResult(`❌ Signout Exception: ${error}`);
    }
  };

  const clearAsyncStorage = async () => {
    addTestResult('🗑️ Clearing AsyncStorage...');
    await AuthTesting.clearAllAuthData();
    addTestResult('✅ AsyncStorage cleared manually');
  };

  const clearTestResults = () => {
    setTestResults('');
  };

  const runAllTests = async () => {
    clearTestResults();
    addTestResult('🧪 Running All Authentication Tests...');
    addTestResult('================================');

    runEnvironmentTest();
    await runAsyncStorageTest();

    addTestResult('================================');
    addTestResult('🧪 All tests completed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Auth System Tester</Text>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Current Status:</Text>
        <Text style={styles.statusText}>Loading: {loading ? '⏳ Yes' : '✅ No'}</Text>
        <Text style={styles.statusText}>User: {user ? '✅ Authenticated' : '❌ Not authenticated'}</Text>
        <Text style={styles.statusText}>Session: {session ? '✅ Active' : '❌ None'}</Text>
        {user && (
          <Text style={styles.statusText}>Email: {user.email}</Text>
        )}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.testButton} onPress={runAllTests}>
          <Text style={styles.buttonText}>🧪 Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={runEnvironmentTest}>
          <Text style={styles.buttonText}>🔧 Test Environment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={runAsyncStorageTest}>
          <Text style={styles.buttonText}>📱 Test AsyncStorage</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.signoutButton} onPress={runSignoutTest}>
            <Text style={styles.buttonText}>🚪 Test Signout</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.clearButton} onPress={clearAsyncStorage}>
          <Text style={styles.buttonText}>🗑️ Clear AsyncStorage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearTestResults}>
          <Text style={styles.buttonText}>🧹 Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Test Results:</Text>
        <Text style={styles.resultsText}>{testResults || 'No tests run yet...'}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
    fontFamily: 'monospace',
  },
  buttonSection: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  signoutButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
});