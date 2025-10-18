import React, { useState, useEffect } from 'react';
import { Save, Tag, Smile } from 'lucide-react';
import { useWriteStore } from '../store/writeStore';
import { EntryQueries } from '../data/queries';
import { searchIndexer } from '../search/indexer';
import { encrypt } from '../crypto/encryption';
import { useAppStore } from '../store/appStore';
import logger from '../utils/logger';

export default function WriteScreen() {
  const { user, encryptionKey } = useAppStore();
  const {
    title,
    body,
    mood,
    tags,
    setTitle,
    setBody,
    setMood,
    setTags,
    addTag,
    removeTag,
    clearForm,
  } = useWriteStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (title || body) {
      const timer = setTimeout(() => {
        if (saveStatus === 'idle') {
          handleSave(true); // Auto-save
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [title, body, mood, tags]);

  const handleSave = async (isAutoSave = false) => {
    if (!user || !encryptionKey) {
      setError('User not authenticated or encryption key not available');
      return;
    }

    if (!title.trim() || !body.trim()) {
      if (!isAutoSave) {
        setError('Title and content are required');
      }
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      // Encrypt the entry data
      const encryptedTitle = await encrypt(title, encryptionKey);
      const encryptedBody = await encrypt(body, encryptionKey);
      const encryptedTags = await encrypt(JSON.stringify(tags), encryptionKey);

      // Create entry object
      const entry = {
        user_id: user.user_id,
        title_enc: encryptedTitle.ciphertext,
        body_enc: encryptedBody.ciphertext,
        tags_enc: encryptedTags.ciphertext,
        iv: encryptedTitle.iv, // Using title IV as primary
        mood: mood,
        entry_at: new Date().toISOString(),
      };

      // Save to database
      const result = await EntryQueries.createEntry(entry);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Add to search index
      await searchIndexer.addEntry({
        id: result.entry!.id,
        title,
        body,
        tags,
        mood,
        entry_at: result.entry!.entry_at,
      });

      setSaveStatus('saved');
      
      if (!isAutoSave) {
        clearForm();
        setError(null);
      }

      // Clear saved status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (error) {
      logger.error('Save error:', error);
      setSaveStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && tags.length < 10) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood <= -3) return 'text-red-600';
    if (mood <= -1) return 'text-orange-500';
    if (mood === 0) return 'text-gray-500';
    if (mood <= 2) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= -3) return '😢';
    if (mood <= -1) return '😐';
    if (mood === 0) return '😶';
    if (mood <= 2) return '🙂';
    return '😊';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Write</h1>
        <p className="text-gray-600">Express your thoughts and feelings</p>
      </div>

      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-lg"
              placeholder="What's on your mind today?"
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood: <span className={getMoodColor(mood)}>{getMoodEmoji(mood)} {mood}</span>
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">-5</span>
              <input
                type="range"
                min="-5"
                max="5"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">+5</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Very negative</span>
              <span>Neutral</span>
              <span>Very positive</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags ({tags.length}/10)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 10 && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Content ({body.length}/50,000 characters)
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input min-h-[300px] resize-y"
              placeholder="Write about your day, thoughts, feelings, or anything on your mind..."
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center space-x-2">
              {saveStatus === 'saving' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-sm text-gray-600">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-green-600">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <div className="h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-sm text-red-600">Error saving</span>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !body.trim()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Tip: Press Ctrl+Enter to save quickly</p>
          <p>🔒 Your entries are encrypted before being stored</p>
        </div>
      </div>
    </div>
  );
}