import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, Brain } from 'lucide-react';
import { searchIndexer } from '../search/indexer';
import { llmService } from '../ai/llm';
import { useAppStore } from '../store/appStore';
import logger from '../utils/logger';

interface WeeklyStats {
  totalEntries: number;
  averageMood: number;
  topKeywords: Array<{ word: string; count: number }>;
  moodTrend: Array<{ date: string; mood: number }>;
}

export default function ReflectScreen() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const loadWeeklyStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get entries from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // This would need to be implemented in the search indexer
      // For now, we'll use mock data
      const mockStats: WeeklyStats = {
        totalEntries: 12,
        averageMood: 1.2,
        topKeywords: [
          { word: 'work', count: 8 },
          { word: 'family', count: 6 },
          { word: 'exercise', count: 4 },
          { word: 'stress', count: 3 },
        ],
        moodTrend: [
          { date: '2024-01-01', mood: 0 },
          { date: '2024-01-02', mood: 1 },
          { date: '2024-01-03', mood: -1 },
          { date: '2024-01-04', mood: 2 },
          { date: '2024-01-05', mood: 1 },
          { date: '2024-01-06', mood: 3 },
          { date: '2024-01-07', mood: 2 },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      logger.error('Failed to load stats:', error);
      setError('Failed to load weekly statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReflection = async () => {
    if (!user || !stats) return;

    setIsGeneratingReflection(true);
    try {
      const reflection = await llmService.generateWeeklyReflection(
        stats,
        user.user_id
      );
      setAiReflection(reflection.content);
    } catch (error) {
      logger.error('Failed to generate reflection:', error);
      setError('Failed to generate AI reflection');
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood <= -2) return 'text-red-600';
    if (mood <= 0) return 'text-orange-500';
    if (mood <= 2) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= -2) return '😢';
    if (mood <= 0) return '😐';
    if (mood <= 2) return '🙂';
    return '😊';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Reflection</h1>
        <p className="text-gray-600">Insights from your journal entries this week</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Mood</p>
                  <p className={`text-2xl font-bold ${getMoodColor(stats.averageMood)}`}>
                    {getMoodEmoji(stats.averageMood)} {stats.averageMood.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Most Active Day</p>
                  <p className="text-2xl font-bold text-gray-900">Wednesday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Trend */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trend</h3>
            <div className="flex items-end space-x-2 h-32">
              {stats.moodTrend.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${
                      day.mood <= -2 ? 'bg-red-500' :
                      day.mood <= 0 ? 'bg-orange-500' :
                      day.mood <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ height: `${Math.max(20, (day.mood + 5) * 8)}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {stats.topKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                >
                  {keyword.word} ({keyword.count})
                </span>
              ))}
            </div>
          </div>

          {/* AI Reflection */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Reflection</h3>
              <button
                onClick={generateReflection}
                disabled={isGeneratingReflection}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>{isGeneratingReflection ? 'Generating...' : 'Generate Reflection'}</span>
              </button>
            </div>

            {aiReflection ? (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{aiReflection}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Generate an AI reflection on your week</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}