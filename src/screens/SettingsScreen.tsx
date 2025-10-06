import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../store/appStore';
import { resetEncryptionKeys, updatePassword, requestPasswordReset } from '../auth/auth';
import { llmService, AIProvider } from '../ai/llm';
import { useDonationStore } from '../store/donationStore';

export default function SettingsScreen() {
  const { 
    user, 
    logout, 
    settings, 
    updateSettings,
    encryptionKey 
  } = useAppStore();
  
  const { isSupporter } = useDonationStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showProviderSelection, setShowProviderSelection] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const aiProviders: Array<{ value: AIProvider; label: string; free: boolean; description: string }> = [
    { value: 'groq', label: 'Groq', free: true, description: 'Fast, free AI with Llama models' },
    { value: 'huggingface', label: 'Hugging Face', free: true, description: 'Free AI models (limited requests)' },
    { value: 'ollama', label: 'Ollama (Local)', free: true, description: 'Run AI models on your device' },
  ];

  const handleProviderChange = (provider: AIProvider) => {
    updateSettings({ aiProvider: provider });
    llmService.setProvider(provider);
    setShowProviderSelection(false);
    
    const providerInfo = llmService.getProviderInfo();
    Alert.alert('Success', `${providerInfo.name} is now your AI provider! It's completely free to use.`);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await llmService.testConnection();
      
      if (result.success) {
        Alert.alert(
          'Connection Successful! ✅',
          `Connected to ${llmService.getProviderInfo().name} in ${result.latency}ms`
        );
      } else {
        Alert.alert(
          'Connection Failed ❌',
          result.error || 'Unable to connect to AI provider'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        Alert.alert('Success', 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', result.error || 'Failed to update password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetEncryption = () => {
    Alert.alert(
      'Reset Encryption Keys',
      'This will make all your existing entries unreadable. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const result = await resetEncryptionKeys();
            if (result.success) {
              Alert.alert('Success', 'Encryption keys reset successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to reset encryption keys');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const handlePasswordReset = () => {
    if (!user) return;
    
    Alert.alert(
      'Reset Password',
      'Send a password reset email to your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            const result = await requestPasswordReset(user.user_id);
            if (result.success) {
              Alert.alert('Success', 'Password reset email sent');
            } else {
              Alert.alert('Error', result.error || 'Failed to send reset email');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4 border-b border-gray-200"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-1">
        <Text className={`font-medium ${destructive ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color="#9ca3af" 
        />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        </View>

        {/* User Info */}
        <View className="px-4 py-6 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
              <Text className="text-white font-bold text-lg">
                {user?.user_id.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="font-medium text-gray-900">
                {user?.user_id || 'User'}
              </Text>
              <Text className="text-sm text-gray-600">Member since {new Date(user?.created_at || '').toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* AI Settings */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">AI Settings</Text>
          
          <View className="p-4 bg-green-50 rounded-lg mb-4">
            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-green-900 mb-1">100% Free AI</Text>
                <Text className="text-sm text-green-800 leading-5">
                  All AI features use completely free providers. No API keys or payments required!
                </Text>
                {isSupporter() && (
                  <View className="mt-2 bg-blue-100 rounded px-2 py-1">
                    <Text className="text-blue-800 text-xs font-medium">
                      ⭐ You're a supporter - thank you!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {renderSettingItem(
            'AI Provider',
            llmService.getProviderInfo().name,
            () => setShowProviderSelection(true),
            <Text className="text-sm text-gray-600">{llmService.getProviderInfo().name}</Text>
          )}

          {showProviderSelection && (
            <View className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-700 mb-3">Choose AI Provider</Text>
              {aiProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.value}
                  className={`p-3 rounded-lg mb-2 border ${
                    settings.aiProvider === provider.value
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => handleProviderChange(provider.value)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{provider.label}</Text>
                      <Text className="text-sm text-gray-600 mt-1">{provider.description}</Text>
                    </View>
                    <View className="flex-row items-center">
                      {provider.free && (
                        <View className="bg-green-100 rounded-full px-2 py-1 mr-2">
                          <Text className="text-green-800 text-xs font-medium">FREE</Text>
                        </View>
                      )}
                      <Ionicons 
                        name={settings.aiProvider === provider.value ? 'radio-button-on' : 'radio-button-off'} 
                        size={20} 
                        color={settings.aiProvider === provider.value ? '#0ea5e9' : '#9ca3af'} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="mt-3 bg-gray-300 rounded-lg py-2"
                onPress={() => setShowProviderSelection(false)}
              >
                <Text className="text-gray-700 text-center font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderSettingItem(
            'Test AI Connection',
            'Check if AI provider is working',
            handleTestConnection,
            isTestingConnection ? (
              <Text className="text-sm text-blue-600">Testing...</Text>
            ) : (
              <Ionicons name="play-circle" size={20} color="#0ea5e9" />
            )
          )}
        </View>

        {/* App Settings */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">App Settings</Text>
          
          <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Notifications</Text>
              <Text className="text-sm text-gray-600 mt-1">Daily journal reminders</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSettings({ notifications: value })}
              trackColor={{ false: '#e5e7eb', true: '#0ea5e9' }}
              thumbColor={settings.notifications ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Auto Sync</Text>
              <Text className="text-sm text-gray-600 mt-1">Automatically sync entries</Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSettings({ autoSync: value })}
              trackColor={{ false: '#e5e7eb', true: '#0ea5e9' }}
              thumbColor={settings.autoSync ? '#ffffff' : '#ffffff'}
            />
          </View>

          {renderSettingItem(
            'Theme',
            settings.theme === 'auto' ? 'System' : settings.theme,
            undefined,
            <Text className="text-sm text-gray-600 capitalize">{settings.theme}</Text>
          )}
        </View>

        {/* Security */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Security</Text>
          
          {renderSettingItem(
            'Change Password',
            'Update your account password',
            () => {} // TODO: Implement password change modal
          )}

          {renderSettingItem(
            'Forgot Password',
            'Send reset email',
            handlePasswordReset
          )}

          {renderSettingItem(
            'Reset Encryption Keys',
            'Make all data unreadable (dangerous)',
            handleResetEncryption,
            undefined,
            true
          )}
        </View>

        {/* Data */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Data</Text>
          
          {renderSettingItem(
            'Export Data',
            'Download your entries',
            () => Alert.alert('Coming Soon', 'Data export feature will be available soon')
          )}

          {renderSettingItem(
            'Clear Cache',
            'Clear local search index',
            () => Alert.alert('Coming Soon', 'Cache clearing feature will be available soon')
          )}
        </View>

        {/* Privacy */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Privacy</Text>
          
          <View className="p-4 bg-blue-50 rounded-lg">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={24} color="#2563eb" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-blue-900 mb-1">Your Privacy is Protected</Text>
                <Text className="text-sm text-blue-800 leading-5">
                  All your entries and messages are encrypted on your device before being stored. 
                  We cannot read your personal data.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Support</Text>
          
          {renderSettingItem(
            'Support TheraJournal',
            isSupporter() ? 'Thank you for your support!' : 'Help keep the app free',
            () => {
              // TODO: Navigate to donation screen
              Alert.alert('Coming Soon', 'Donation screen will be available soon!');
            },
            isSupporter() ? (
              <View className="bg-green-100 rounded-full px-2 py-1">
                <Text className="text-green-800 text-xs font-medium">SUPPORTER</Text>
              </View>
            ) : (
              <Ionicons name="heart" size={20} color="#ef4444" />
            )
          )}
        </View>

        {/* About */}
        <View className="px-4 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">About</Text>
          
          {renderSettingItem(
            'Version',
            '1.0.0',
            undefined,
            <Text className="text-sm text-gray-600">1.0.0</Text>
          )}

          {renderSettingItem(
            'Privacy Policy',
            'How we protect your data',
            () => Alert.alert('Coming Soon', 'Privacy policy will be available soon')
          )}

          {renderSettingItem(
            'Terms of Service',
            'App usage terms',
            () => Alert.alert('Coming Soon', 'Terms of service will be available soon')
          )}

          {renderSettingItem(
            'Support',
            'Get help and feedback',
            () => Alert.alert('Coming Soon', 'Support feature will be available soon')
          )}
        </View>

        {/* Sign Out */}
        <View className="px-4 py-8">
          <TouchableOpacity
            className="bg-red-50 border border-red-200 rounded-lg py-4 items-center"
            onPress={handleLogout}
          >
            <Text className="text-red-600 font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
