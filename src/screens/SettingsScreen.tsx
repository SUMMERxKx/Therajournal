import React, { useState } from 'react';
import { LogOut, Shield, Bell, Palette, Database, Heart } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useDonationStore } from '../store/donationStore';
import { resetEncryptionKeys, requestPasswordReset } from '../auth/auth';
import { llmService, AIProvider } from '../ai/llm';
import logger from '../utils/logger';

export default function SettingsScreen() {
  const { 
    user, 
    logout, 
    settings, 
    updateSettings,
  } = useAppStore();
  
  const { isSupporter } = useDonationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      logger.error('Logout error:', error);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset(user.email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password reset email sent!');
      }
    } catch (error) {
      logger.error('Password reset error:', error);
      setError('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEncryption = async () => {
    if (!confirm('This will make all your data unreadable. Are you sure?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await resetEncryptionKeys();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Encryption keys reset successfully');
      }
    } catch (error) {
      logger.error('Reset encryption error:', error);
      setError('Failed to reset encryption keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    updateSettings({ aiProvider: provider });
    llmService.setProvider(provider);
  };

  const renderSettingItem = (
    title: string,
    description: string,
    action: () => void,
    icon?: React.ReactNode,
    isDangerous = false
  ) => (
    <button
      onClick={action}
      disabled={isLoading}
      className={`w-full p-4 rounded-lg border transition-colors text-left ${
        isDangerous
          ? 'border-red-200 hover:bg-red-50'
          : 'border-gray-200 hover:bg-gray-50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <div className="flex-1">
          <h3 className={`font-medium ${isDangerous ? 'text-red-900' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm ${isDangerous ? 'text-red-600' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Account */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Signed in as</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            
            {renderSettingItem(
              'Change Password',
              'Update your account password',
              () => alert('Password change feature coming soon. Use "Forgot Password" to reset via email.'),
              <Shield className="h-5 w-5 text-gray-400" />
            )}

            {renderSettingItem(
              'Forgot Password',
              'Send reset email',
              handlePasswordReset,
              <Shield className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* AI Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <div className="space-y-2">
                {(['groq', 'huggingface', 'ollama'] as AIProvider[]).map((provider) => (
                  <label key={provider} className="flex items-center">
                    <input
                      type="radio"
                      checked={settings.aiProvider === provider}
                      onChange={() => handleProviderChange(provider)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {provider} {provider === 'groq' && '(Recommended)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Theme</h3>
                <p className="text-sm text-gray-600">Choose your preferred theme</p>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
                className="input w-32"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSettings({ notifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Auto Sync</h3>
                <p className="text-sm text-gray-600">Automatically sync data</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data</h2>
          <div className="space-y-3">
            {renderSettingItem(
              'Export Data',
              'Download your entries',
              () => alert('Data export feature coming soon'),
              <Database className="h-5 w-5 text-gray-400" />
            )}

            {renderSettingItem(
              'Clear Cache',
              'Clear local search index',
              () => alert('Cache clearing feature coming soon'),
              <Database className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Privacy */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="font-medium text-blue-900">Your Privacy is Protected</h3>
                <p className="text-sm text-blue-800 mt-1">
                  All your entries and messages are encrypted on your device before being stored. 
                  We cannot read your personal data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Support</h2>
          <div className="space-y-3">
            {renderSettingItem(
              'Support TheraJournal',
              isSupporter() ? 'Thank you for your support!' : 'Help keep the app free',
              () => window.location.href = '/support',
              <Heart className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            {renderSettingItem(
              'Reset Encryption Keys',
              'Make all data unreadable (dangerous)',
              handleResetEncryption,
              <Shield className="h-5 w-5 text-red-400" />,
              true
            )}

            {renderSettingItem(
              'Sign Out',
              'Sign out of your account',
              handleLogout,
              <LogOut className="h-5 w-5 text-red-400" />,
              true
            )}
          </div>
        </div>
      </div>
    </div>
  );
}