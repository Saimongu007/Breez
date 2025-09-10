import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { uploadResource, getCategories } from '@/lib/database';
import { useAuth } from './useAuth';

// Import with try-catch to handle missing dependencies
let DocumentPicker: any = null;
let ImagePicker: any = null;

try {
  DocumentPicker = require('expo-document-picker');
} catch (error) {
  console.warn('expo-document-picker not available');
}

try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('expo-image-picker not available');
}

export interface FileUploadData {
  title: string;
  description: string;
  category: string;
  fileType: string;
  file?: any; // Made generic to handle different file types
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const pickDocument = async (): Promise<any> => {
    if (!DocumentPicker) {
      Alert.alert('Feature Not Available', 'Document picker is not available. Please install expo-document-picker.');
      return null;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
      return null;
    }
  };

  const pickImage = async (): Promise<any> => {
    if (!ImagePicker) {
      Alert.alert('Feature Not Available', 'Image picker is not available. Please install expo-image-picker.');
      return null;
    }

    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  };

  const uploadFile = async (file: any): Promise<string | null> => {
    try {
      const fileExt = file.name?.split('.').pop() || 'unknown';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`; // Remove 'resources/' prefix since bucket name is already 'resources'

      // Convert file to blob for upload
      const response = await fetch(file.uri);
      const blob = await response.blob();

      console.log('Uploading file:', { fileName, filePath, size: blob.size, type: blob.type });

      const { data, error } = await supabase.storage
        .from('resources')
        .upload(filePath, blob, {
          contentType: file.mimeType || blob.type || 'application/octet-stream',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        Alert.alert('Upload Error', `Failed to upload file: ${error.message}`);
        return null;
      }

      console.log('File uploaded successfully:', data);
      return data.path;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      Alert.alert('Upload Error', 'An unexpected error occurred during file upload');
      return null;
    }
  };

  const calculateCoinPrice = (fileType: string, fileSize?: number): number => {
    // Base price calculation
    let basePrice = 3;
    
    switch (fileType.toUpperCase()) {
      case 'PDF':
        basePrice = 5;
        break;
      case 'DOC':
      case 'DOCX':
        basePrice = 4;
        break;
      case 'IMAGE':
      case 'JPG':
      case 'PNG':
        basePrice = 3;
        break;
      default:
        basePrice = 3;
    }

    // Adjust based on file size (if available)
    if (fileSize) {
      const sizeInMB = fileSize / (1024 * 1024);
      if (sizeInMB > 10) basePrice += 2;
      else if (sizeInMB > 5) basePrice += 1;
    }

    return Math.max(basePrice, 2); // Minimum 2 coins
  };

  const submitUpload = async (uploadData: FileUploadData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // For demo purposes, if no file is selected, create a mock upload
    if (!uploadData.file) {
      return await submitMockUpload(uploadData);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get categories to find category ID
      const categories = await getCategories();
      const selectedCategory = categories.find(cat => cat.name === uploadData.category);
      
      if (!selectedCategory) {
        return { success: false, error: 'Invalid category selected' };
      }

      setUploadProgress(25);

      // Upload file to storage
      const filePath = await uploadFile(uploadData.file);
      if (!filePath) {
        return { success: false, error: 'Failed to upload file. Please check if the storage bucket exists.' };
      }

      setUploadProgress(50);

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      setUploadProgress(75);

      // Calculate coin price
      const coinPrice = calculateCoinPrice(uploadData.fileType, uploadData.file.size);

      // Create resource record with file URL and size (auto-approved for demo)
      const { data, error } = await uploadResource({
        title: uploadData.title,
        description: uploadData.description,
        category_id: selectedCategory.id,
        file_type: uploadData.fileType,
        file_url: filePath, // Store the file path for later URL generation
        file_size: uploadData.file.size || 0,
        coin_price: coinPrice,
        uploader_id: user.id,
        is_approved: true, // Auto-approve for demo purposes
        tags: uploadData.title.split(' ').filter(word => word.length > 2) // Simple tag extraction
      });

      setUploadProgress(100);

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: error.message || 'Failed to create resource record' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in submitUpload:', error);
      return { success: false, error: 'An unexpected error occurred during upload' };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Mock upload for demo purposes when file pickers aren't available
  const submitMockUpload = async (uploadData: FileUploadData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get categories to find category ID
      const categories = await getCategories();
      const selectedCategory = categories.find(cat => cat.name === uploadData.category);
      
      if (!selectedCategory) {
        return { success: false, error: 'Invalid category selected' };
      }

      setUploadProgress(25);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(50);

      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(75);

      // Calculate coin price
      const coinPrice = calculateCoinPrice(uploadData.fileType);

      // Create resource record without actual file (mock upload)
      const { data, error } = await uploadResource({
        title: uploadData.title,
        description: uploadData.description,
        category_id: selectedCategory.id,
        file_type: uploadData.fileType,
        file_url: `mock-${Date.now()}.${uploadData.fileType.toLowerCase()}`, // Mock file path
        file_size: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
        coin_price: coinPrice,
        uploader_id: user.id,
        is_approved: true, // Auto-approve for demo purposes
        tags: uploadData.title.split(' ').filter(word => word.length > 2)
      });

      setUploadProgress(100);

      if (error) {
        return { success: false, error: error.message || 'Failed to create resource record' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in submitMockUpload:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploading,
    uploadProgress,
    pickDocument,
    pickImage,
    submitUpload,
    calculateCoinPrice,
    isDocumentPickerAvailable: !!DocumentPicker,
    isImagePickerAvailable: !!ImagePicker
  };
};