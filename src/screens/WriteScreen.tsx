import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from 'react-native-slider';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWriteStore } from '../store/writeStore';
import { useAppStore } from '../store/appStore';
import { EntryQueries } from '../data/queries';
import { searchIndexer } from '../search/indexer';
import { MOOD_LABELS } from '../utils/constants';
import { EntryCreate } from '../data/schemas';

export default function WriteScreen() {
  const { currentEntry, isDraft, isSaving, updateCurrentEntry, setSaving, clearCurrentEntry } = useWriteStore();
  const { user, encryptionKey } = useAppStore();
  const queryClient = useQueryClient();
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMoodSlider, setShowMoodSlider] = useState(false);

  // Initialize tags from current entry
  useEffect(() => {
    if (currentEntry.tags) {
      setTags(currentEntry.tags);
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDraft || !currentEntry.title || !currentEntry.body) return;

    const autoSave = setInterval(() => {
      // Auto-save logic could be implemented here
      console.log('Auto-saving draft...');
    }, 30000);

    return () => clearInterval(autoSave);
  }, [isDraft, currentEntry]);

  // Save entry mutation
  const saveEntryMutation = useMutation({
    mutationFn: async (entryData: EntryCreate) => {
      if (!user || !encryptionKey) {
        throw new Error('User not authenticated or encryption key missing');
      }

      return await EntryQueries.createEntry(user.user_id, entryData, encryptionKey);
    },
    onSuccess: async (savedEntry) => {
      // Decrypt and add to search index
      const decryptedEntry = await EntryQueries.decryptEntry(savedEntry, encryptionKey!);
      await searchIndexer.addEntry(decryptedEntry);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      
      // Clear the current entry
      clearCurrentEntry();
      setTags([]);
      setTagInput('');
      
      Alert.alert('Success', 'Entry saved successfully!');
    },
    onError: (error) => {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSave = () => {
    if (!currentEntry.title?.trim() || !currentEntry.body?.trim()) {
      Alert.alert('Error', 'Please fill in both title and content.');
      return;
    }

    if (!encryptionKey) {
      Alert.alert('Error', 'Encryption not set up. Please check your settings.');
      return;
    }

    setSaving(true);

    const entryData: EntryCreate = {
      title: currentEntry.title.trim(),
      body: currentEntry.body.trim(),
      mood: currentEntry.mood,
      tags: tags.filter(tag => tag.trim().length > 0),
      entry_at: currentEntry.entry_at || new Date().toISOString(),
    };

    saveEntryMutation.mutate(entryData);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      updateCurrentEntry({ tags: newTags });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    updateCurrentEntry({ tags: newTags });
  };

  const getMoodLabel = (mood?: number) => {
    if (mood === undefined) return 'No mood selected';
    const index = Math.max(0, Math.min(6, mood + 5));
    return MOOD_LABELS[index];
  };

  const getMoodColor = (mood?: number) => {
    if (mood === undefined) return '#6b7280';
    if (mood <= -3) return '#ef4444'; // red
    if (mood <= -1) return '#f97316'; // orange
    if (mood <= 1) return '#eab308';  // yellow
    if (mood <= 3) return '#22c55e';  // green
    return '#10b981'; // emerald
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4">
          {/* Header */}
          <View className="py-4">
            <Text className="text-2xl font-bold text-gray-900">Write</Text>
            <Text className="text-gray-600 mt-1">Capture your thoughts and feelings</Text>
          </View>

          {/* Title Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Title</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
              placeholder="What's on your mind?"
              value={currentEntry.title || ''}
              onChangeText={(text) => updateCurrentEntry({ title: text })}
              maxLength={200}
              multiline
            />
            <Text className="text-xs text-gray-500 mt-1">
              {(currentEntry.title?.length || 0)}/200 characters
            </Text>
          </View>

          {/* Mood Selector */}
          <View className="mb-4">
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-3 py-3 flex-row items-center justify-between"
              onPress={() => setShowMoodSlider(!showMoodSlider)}
            >
              <Text className="text-gray-700">Mood</Text>
              <View className="flex-row items-center">
                <Text 
                  className="text-sm mr-2"
                  style={{ color: getMoodColor(currentEntry.mood) }}
                >
                  {getMoodLabel(currentEntry.mood)}
                </Text>
                <Ionicons 
                  name={showMoodSlider ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {showMoodSlider && (
              <View className="mt-3 px-2">
                <Slider
                  value={currentEntry.mood || 0}
                  minimumValue={-5}
                  maximumValue={5}
                  step={1}
                  onValueChange={(value) => updateCurrentEntry({ mood: value })}
                  thumbStyle={{
                    backgroundColor: getMoodColor(currentEntry.mood),
                    width: 24,
                    height: 24,
                  }}
                  trackStyle={{
                    height: 4,
                    borderRadius: 2,
                  }}
                  minimumTrackTintColor={getMoodColor(currentEntry.mood)}
                  maximumTrackTintColor="#e5e7eb"
                />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-xs text-gray-500">Very Low</Text>
                  <Text className="text-xs text-gray-500">Very Good</Text>
                </View>
              </View>
            )}
          </View>

          {/* Tags */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Tags (optional)</Text>
            
            {/* Tag Input */}
            <View className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Add a tag..."
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                maxLength={50}
              />
              <TouchableOpacity
                className="ml-2 bg-blue-500 rounded-lg px-3 py-2"
                onPress={addTag}
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tags Display */}
            {tags.length > 0 && (
              <View className="flex-row flex-wrap">
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                  >
                    <Text className="text-blue-800 text-sm">{tag}</Text>
                    <TouchableOpacity
                      className="ml-1"
                      onPress={() => removeTag(tag)}
                    >
                      <Ionicons name="close" size={16} color="#1e40af" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <Text className="text-xs text-gray-500">
              {tags.length}/10 tags
            </Text>
          </View>

          {/* Content Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Content</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
              placeholder="What happened today? How are you feeling? What's on your mind?"
              value={currentEntry.body || ''}
              onChangeText={(text) => updateCurrentEntry({ body: text })}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              maxLength={50000}
            />
            <Text className="text-xs text-gray-500 mt-1">
              {(currentEntry.body?.length || 0)}/50,000 characters
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-4 pb-4 border-t border-gray-200 bg-white">
          <TouchableOpacity
            className={`rounded-lg py-4 flex-row items-center justify-center ${
              !currentEntry.title?.trim() || !currentEntry.body?.trim() || isSaving
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            onPress={handleSave}
            disabled={!currentEntry.title?.trim() || !currentEntry.body?.trim() || isSaving}
          >
            {isSaving ? (
              <Text className="text-white font-medium">Saving...</Text>
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" className="mr-2" />
                <Text className="text-white font-medium">Save Entry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
