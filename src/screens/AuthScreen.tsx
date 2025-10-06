import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '../store/appStore';
import { signUp, signIn, setupKeys, hasEncryptionKeys } from '../auth/auth';
import { SignUp, SignIn } from '../data/schemas';

export default function AuthScreen() {
  const { login } = useAppStore();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [useDeviceKeystore, setUseDeviceKeystore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (isSignUp && password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      let authResult;
      
      if (isSignUp) {
        const signUpData: SignUp = { email, password };
        authResult = await signUp(signUpData);
      } else {
        const signInData: SignIn = { email, password };
        authResult = await signIn(signInData);
      }

      if (authResult.error) {
        Alert.alert('Error', authResult.error);
        return;
      }

      if (!authResult.user) {
        Alert.alert('Error', 'Authentication failed.');
        return;
      }

      // Check if user needs to set up encryption keys
      const hasKeys = await hasEncryptionKeys();
      
      if (!hasKeys) {
        // Set up encryption keys
        const keySetupResult = await setupKeys({
          passphrase: useDeviceKeystore ? undefined : passphrase,
          useDeviceKeystore,
        });

        if (!keySetupResult.success) {
          Alert.alert('Error', keySetupResult.error || 'Failed to set up encryption keys.');
          return;
        }
      }

      // Login successful
      await login(authResult.user);
      
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPassphrase('');
    setUseDeviceKeystore(true);
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="pt-12 pb-8 items-center">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="journal" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">TheraJournal</Text>
            <Text className="text-gray-600 mt-2 text-center">
              Your private space for reflection and growth
            </Text>
          </View>

          {/* Auth Form */}
          <View className="space-y-4">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Encryption Setup (Sign Up only) */}
            {isSignUp && (
              <View className="border border-gray-200 rounded-lg p-4">
                <Text className="text-sm font-medium text-gray-700 mb-3">Encryption Setup</Text>
                
                {/* Device Keystore Option */}
                <TouchableOpacity
                  className="flex-row items-center mb-3"
                  onPress={() => setUseDeviceKeystore(true)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    useDeviceKeystore ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {useDeviceKeystore && (
                      <View className="w-2 h-2 bg-white rounded-full m-auto" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">Use Device Keystore</Text>
                    <Text className="text-gray-600 text-sm">Simple and secure (recommended)</Text>
                  </View>
                </TouchableOpacity>

                {/* Passphrase Option */}
                <TouchableOpacity
                  className="flex-row items-center mb-3"
                  onPress={() => setUseDeviceKeystore(false)}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    !useDeviceKeystore ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {!useDeviceKeystore && (
                      <View className="w-2 h-2 bg-white rounded-full m-auto" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">Use Passphrase</Text>
                    <Text className="text-gray-600 text-sm">More secure, works across devices</Text>
                  </View>
                </TouchableOpacity>

                {/* Passphrase Input */}
                {!useDeviceKeystore && (
                  <View className="mt-2">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                      placeholder="Enter a secure passphrase"
                      value={passphrase}
                      onChangeText={setPassphrase}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      This will be used to encrypt your data. Keep it safe!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Auth Button */}
          <TouchableOpacity
            className={`mt-6 rounded-lg py-4 flex-row items-center justify-center ${
              isLoading ? 'bg-gray-300' : 'bg-blue-500'
            }`}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text className="text-white font-medium text-lg">
              {isLoading 
                ? 'Please wait...' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'
              }
            </Text>
          </TouchableOpacity>

          {/* Toggle Auth Mode */}
          <TouchableOpacity
            className="mt-4 py-2"
            onPress={toggleAuthMode}
          >
            <Text className="text-center text-blue-500">
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>

          {/* Privacy Notice */}
          <View className="mt-8 p-4 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-600 text-center leading-5">
              🔒 Your data is encrypted on your device before being stored. 
              We can't read your entries or chat messages.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
