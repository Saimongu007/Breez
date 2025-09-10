import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TabsIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to upload tab as default
    router.replace('/(tabs)/upload');
  }, []);

  return null;
}