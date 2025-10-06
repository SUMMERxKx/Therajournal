import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../store/appStore';
import { EntryQueries } from '../data/queries';
import { searchIndexer } from '../search/indexer';
import { llmService } from '../ai/llm';
import { WeeklyStats, SearchResult } from '../data/schemas';

const { width } = Dimensions.get('window');

export default function ReflectScreen() {
  const { user, encryptionKey } = useAppStore();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [weeklyReflection, setWeeklyReflection] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user || !encryptionKey) return;

    setIsLoading(true);
    try {
      // Get entries from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const entries = await EntryQueries.getEntries(user.user_id, 100);
      const decryptedEntries = await EntryQueries.decryptEntries(entries, encryptionKey);
      
      // Filter to last week
      const weeklyEntries = decryptedEntries.filter(entry => 
        new Date(entry.entry_at) >= oneWeekAgo
      );

      // Calculate stats
      const entriesCount = weeklyEntries.length;
      const avgMood = weeklyEntries.length > 0 
        ? weeklyEntries.reduce((sum, entry) => sum + (entry.mood || 0), 0) / weeklyEntries.length
        : 0;

      // Get top keywords from search index
      const allEntries = searchIndexer.getAllEntries();
      const keywordCounts = new Map<string, number>();
      
      allEntries.forEach(entry => {
        const words = (entry.title + ' ' + entry.body)
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3);
        
        words.forEach(word => {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        });
      });

      const topKeywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));

      // Calculate mood trend (last 7 days)
      const moodTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayEntries = weeklyEntries.filter(entry => {
          const entryDate = new Date(entry.entry_at);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === date.getTime();
        });

        const dayMood = dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + (entry.mood || 0), 0) / dayEntries.length
          : 0;

        moodTrend.push({
          date: date.toISOString(),
          mood: dayMood
        });
      }

      setStats({
        entriesCount,
        avgMood,
        topKeywords,
        moodTrend
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
      Alert.alert('Error', 'Failed to load reflection data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyReflection = async () => {
    if (!stats || stats.entriesCount === 0) {
      Alert.alert('No Data', 'You need at least one entry to generate a reflection');
      return;
    }

    setIsGeneratingReflection(true);
    try {
      // Get recent entries for context
      const recentEntries: SearchResult[] = stats.moodTrend
        .filter(day => day.mood !== 0)
        .map(day => ({
          id: '',
          title: `Entry from ${new Date(day.date).toLocaleDateString()}`,
          body: '',
          tags: [],
          mood: day.mood,
          entry_at: day.date,
          score: 1
        }));

      const reflection = await llmService.generateWeeklyReflection(recentEntries);
      setWeeklyReflection(reflection);
    } catch (error) {
      console.error('Failed to generate reflection:', error);
      Alert.alert('Error', 'Failed to generate weekly reflection');
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood <= -3) return '#ef4444'; // red
    if (mood <= -1) return '#f97316'; // orange
    if (mood <= 1) return '#eab308';  // yellow
    if (mood <= 3) return '#22c55e';  // green
    return '#10b981'; // emerald
  };

  const getMoodLabel = (mood: number) => {
    if (mood <= -3) return 'Very Low';
    if (mood <= -1) return 'Low';
    if (mood <= 1) return 'Neutral';
    if (mood <= 3) return 'Good';
    return 'Very Good';
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading reflection data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">Reflect</Text>
          <Text className="text-gray-600 mt-1">Insights from your journal</Text>
        </View>

        {!stats || stats.entriesCount === 0 ? (
          // Empty State
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="analytics-outline" size={80} color="#9ca3af" />
            <Text className="text-xl font-medium text-gray-900 mt-4">
              No Data Yet
            </Text>
            <Text className="text-gray-600 text-center mt-2 px-8">
              Write a few journal entries to see your insights and patterns here.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View className="space-y-4">
              {/* Entries Count */}
              <View className="bg-blue-50 rounded-lg p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-blue-600 text-sm font-medium">Entries This Week</Text>
                    <Text className="text-2xl font-bold text-blue-900 mt-1">
                      {stats.entriesCount}
                    </Text>
                  </View>
                  <Ionicons name="document-text" size={32} color="#2563eb" />
                </View>
              </View>

              {/* Average Mood */}
              <View className="bg-green-50 rounded-lg p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-green-600 text-sm font-medium">Average Mood</Text>
                    <Text className="text-2xl font-bold text-green-900 mt-1">
                      {getMoodLabel(stats.avgMood)}
                    </Text>
                    <Text className="text-sm text-green-700">
                      {stats.avgMood.toFixed(1)}/5
                    </Text>
                  </View>
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: getMoodColor(stats.avgMood) }}
                  >
                    <Ionicons name="happy" size={24} color="white" />
                  </View>
                </View>
              </View>

              {/* Top Keywords */}
              {stats.topKeywords.length > 0 && (
                <View className="bg-purple-50 rounded-lg p-4">
                  <Text className="text-purple-600 text-sm font-medium mb-3">
                    Most Common Words
                  </Text>
                  <View className="flex-row flex-wrap">
                    {stats.topKeywords.map((keyword, index) => (
                      <View
                        key={index}
                        className="bg-purple-100 rounded-full px-3 py-1 mr-2 mb-2"
                      >
                        <Text className="text-purple-800 text-sm">
                          {keyword.word} ({keyword.count})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Mood Trend */}
              <View className="bg-orange-50 rounded-lg p-4">
                <Text className="text-orange-600 text-sm font-medium mb-3">
                  Mood Trend (Last 7 Days)
                </Text>
                <View className="flex-row justify-between items-end h-20">
                  {stats.moodTrend.map((day, index) => (
                    <View key={index} className="items-center flex-1">
                      <View
                        className="w-4 rounded-t"
                        style={{
                          height: Math.max(4, (day.mood + 5) * 4),
                          backgroundColor: getMoodColor(day.mood)
                        }}
                      />
                      <Text className="text-xs text-gray-600 mt-1">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Weekly Reflection */}
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Weekly Reflection
                </Text>
                <TouchableOpacity
                  className={`rounded-lg px-4 py-2 ${
                    isGeneratingReflection ? 'bg-gray-300' : 'bg-blue-500'
                  }`}
                  onPress={generateWeeklyReflection}
                  disabled={isGeneratingReflection}
                >
                  <Text className="text-white font-medium">
                    {isGeneratingReflection ? 'Generating...' : 'Generate'}
                  </Text>
                </TouchableOpacity>
              </View>

              {weeklyReflection ? (
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-gray-900 leading-6">
                    {weeklyReflection}
                  </Text>
                </View>
              ) : (
                <View className="bg-gray-50 rounded-lg p-4 items-center">
                  <Ionicons name="bulb-outline" size={32} color="#9ca3af" />
                  <Text className="text-gray-600 text-center mt-2">
                    Generate a personalized reflection based on your recent entries
                  </Text>
                </View>
              )}
            </View>

            {/* Insights */}
            <View className="mt-6 mb-8">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Quick Insights
              </Text>
              
              <View className="space-y-3">
                {stats.entriesCount >= 3 && (
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" className="mt-0.5" />
                    <Text className="text-gray-700 ml-2 flex-1">
                      Great consistency! You've written {stats.entriesCount} entries this week.
                    </Text>
                  </View>
                )}

                {stats.avgMood > 2 && (
                  <View className="flex-row items-start">
                    <Ionicons name="trending-up" size={20} color="#22c55e" className="mt-0.5" />
                    <Text className="text-gray-700 ml-2 flex-1">
                      Your mood has been positive this week. Keep up the good work!
                    </Text>
                  </View>
                )}

                {stats.avgMood < -1 && (
                  <View className="flex-row items-start">
                    <Ionicons name="heart" size={20} color="#ef4444" className="mt-0.5" />
                    <Text className="text-gray-700 ml-2 flex-1">
                      It looks like you've had a challenging week. Remember to be kind to yourself.
                    </Text>
                  </View>
                )}

                {stats.topKeywords.length > 0 && (
                  <View className="flex-row items-start">
                    <Ionicons name="analytics" size={20} color="#6366f1" className="mt-0.5" />
                    <Text className="text-gray-700 ml-2 flex-1">
                      Your most common themes this week: {stats.topKeywords.slice(0, 3).map(k => k.word).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
