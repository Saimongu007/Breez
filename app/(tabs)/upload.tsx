import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Upload, FileText, Image, File, Plus, Check } from 'lucide-react-native';
import { useFileUpload } from '@/hooks/useFileUpload';
import { getCategories, Category } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';

export default function UploadScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { uploading, uploadProgress, pickDocument, pickImage, submitUpload, calculateCoinPrice } = useFileUpload();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const handleFileSelect = async (type: string) => {
    setSelectedFileType(type);
    
    try {
      let file = null;
      
      if (type === 'PDF' || type === 'DOC') {
        file = await pickDocument();
      } else if (type === 'Image') {
        file = await pickImage();
      }
      
      if (file) {
        setSelectedFile(file);
        Alert.alert('File Selected', `${file.name || 'Image'} selected successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!title || !description || !category || !selectedFile) {
      Alert.alert('Error', 'Please fill in all fields and select a file');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to upload files');
      return;
    }

    setLoading(true);

    const result = await submitUpload({
      title,
      description,
      category,
      fileType: selectedFileType,
      file: selectedFile
    });

    setLoading(false);

    if (result.success) {
      const coinPrice = calculateCoinPrice(selectedFileType, selectedFile.size);
      Alert.alert(
        'Success!', 
        `File uploaded successfully! You earned 10 coins and it will be available for ${coinPrice} coins once approved.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setTitle('');
              setDescription('');
              setCategory('');
              setSelectedFile(null);
              setSelectedFileType('');
            }
          }
        ]
      );
    } else {
      Alert.alert('Upload Failed', result.error || 'An error occurred during upload');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Resource</Text>
          <Text style={styles.subtitle}>Share your academic materials</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter resource title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your resource"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.name && styles.categoryChipActive
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Text style={[
                    styles.categoryText,
                    category === cat.name && styles.categoryTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>File Type</Text>
            <View style={styles.fileTypes}>
              <TouchableOpacity
                style={[
                  styles.fileTypeCard,
                  selectedFileType === 'PDF' && styles.fileTypeCardActive
                ]}
                onPress={() => handleFileSelect('PDF')}
                disabled={uploading}
              >
                <FileText size={24} color={selectedFileType === 'PDF' ? '#2563EB' : '#6B7280'} />
                <Text style={[
                  styles.fileTypeText,
                  selectedFileType === 'PDF' && styles.fileTypeTextActive
                ]}>
                  PDF
                </Text>
                {selectedFileType === 'PDF' && selectedFile && (
                  <Check size={16} color="#2563EB" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fileTypeCard,
                  selectedFileType === 'DOC' && styles.fileTypeCardActive
                ]}
                onPress={() => handleFileSelect('DOC')}
                disabled={uploading}
              >
                <File size={24} color={selectedFileType === 'DOC' ? '#2563EB' : '#6B7280'} />
                <Text style={[
                  styles.fileTypeText,
                  selectedFileType === 'DOC' && styles.fileTypeTextActive
                ]}>
                  DOC
                </Text>
                {selectedFileType === 'DOC' && selectedFile && (
                  <Check size={16} color="#2563EB" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fileTypeCard,
                  selectedFileType === 'Image' && styles.fileTypeCardActive
                ]}
                onPress={() => handleFileSelect('Image')}
                disabled={uploading}
              >
                <Image size={24} color={selectedFileType === 'Image' ? '#2563EB' : '#6B7280'} />
                <Text style={[
                  styles.fileTypeText,
                  selectedFileType === 'Image' && styles.fileTypeTextActive
                ]}>
                  Image
                </Text>
                {selectedFileType === 'Image' && selectedFile && (
                  <Check size={16} color="#2563EB" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.uploadButton, (uploading || loading) && styles.uploadButtonDisabled]} 
            onPress={handleUpload}
            disabled={uploading || loading}
          >
            <Upload size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>
              {uploading ? `Uploading... ${uploadProgress}%` : loading ? 'Processing...' : 'Upload Resource'}
            </Text>
          </TouchableOpacity>
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
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
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
  fileTypes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  fileTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  fileTypeCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  fileTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  fileTypeTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
});