import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDonationStore } from '../store/donationStore';

export default function DonationScreen() {
  const { 
    config, 
    donations, 
    addDonation, 
    getTotalDonated, 
    getMonthlyDonations,
    isSupporter 
  } = useDonationStore();
  
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleDonate = async (tier: typeof config.tiers[0]) => {
    try {
      // For now, use PayPal link (can be enhanced with Stripe later)
      if (config.paypalLink) {
        const paypalUrl = `${config.paypalLink}?amount=${tier.amount}`;
        const canOpen = await Linking.canOpenURL(paypalUrl);
        
        if (canOpen) {
          await Linking.openURL(paypalUrl);
          
          // Record the donation attempt (user will confirm on PayPal)
          const donationRecord = {
            id: Date.now().toString(),
            amount: tier.amount,
            tier: tier.id,
            timestamp: new Date().toISOString(),
            method: 'paypal' as const,
            acknowledged: false,
          };
          
          addDonation(donationRecord);
          
          Alert.alert(
            'Thank You! 💙',
            `Thank you for your ${tier.label} donation! Your support helps keep TheraJournal free and ad-free for everyone.`,
            [{ text: 'You\'re Welcome!', style: 'default' }]
          );
        } else {
          Alert.alert('Error', 'Unable to open PayPal. Please try again.');
        }
      }
    } catch (error) {
      console.error('Donation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const totalDonated = getTotalDonated();
  const monthlyDonations = getMonthlyDonations();
  const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
  const isUserSupporter = isSupporter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-6 items-center">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="heart" size={40} color="#0ea5e9" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Support TheraJournal
          </Text>
          <Text className="text-gray-600 text-center mt-2 px-4">
            Help keep TheraJournal free, private, and ad-free for everyone
          </Text>
        </View>

        {/* Supporter Status */}
        {isUserSupporter && (
          <View className="bg-green-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center">
              <Ionicons name="star" size={24} color="#22c55e" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-green-900">You're a Supporter! ⭐</Text>
                <Text className="text-sm text-green-800 mt-1">
                  Thank you for your support this month (${monthlyTotal} total)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Impact Stats */}
        <View className="bg-blue-50 rounded-lg p-4 mb-6">
          <Text className="font-medium text-blue-900 mb-3">Your Impact</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-900">
                ${totalDonated}
              </Text>
              <Text className="text-sm text-blue-700">Total Donated</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-900">
                {donations.length}
              </Text>
              <Text className="text-sm text-blue-700">Donations</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-900">
                {monthlyTotal}
              </Text>
              <Text className="text-sm text-blue-700">This Month</Text>
            </View>
          </View>
        </View>

        {/* Why Donate */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Why Support TheraJournal?
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#22c55e" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">100% Privacy</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Your journal entries are encrypted and never shared
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Ionicons name="heart" size={20} color="#ef4444" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Ad-Free Experience</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  No ads, no tracking, no distractions from your thoughts
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Ionicons name="people" size={20} color="#8b5cf6" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Free for Everyone</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Your donations help keep the app free for all users
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Ionicons name="rocket" size={20} color="#f59e0b" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">AI Costs</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Covers the cost of AI conversations and weekly reflections
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Donation Tiers */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Choose Your Support Level
          </Text>
          
          <View className="space-y-3">
            {config.tiers.map((tier) => (
              <TouchableOpacity
                key={tier.id}
                className={`rounded-lg p-4 border-2 ${
                  selectedTier === tier.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setSelectedTier(tier.id)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-xl font-bold text-gray-900">
                        ${tier.amount}
                      </Text>
                      {tier.popular && (
                        <View className="bg-blue-500 rounded-full px-2 py-1 ml-2">
                          <Text className="text-white text-xs font-medium">POPULAR</Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-medium text-gray-900 mt-1">
                      {tier.label}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {tier.description}
                    </Text>
                  </View>
                  <Ionicons 
                    name={selectedTier === tier.id ? 'radio-button-on' : 'radio-button-off'} 
                    size={24} 
                    color={selectedTier === tier.id ? '#0ea5e9' : '#9ca3af'} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {selectedTier && (
            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-4 mt-4 flex-row items-center justify-center"
              onPress={() => {
                const tier = config.tiers.find(t => t.id === selectedTier);
                if (tier) handleDonate(tier);
              }}
            >
              <Ionicons name="heart" size={20} color="white" />
              <Text className="text-white font-medium text-lg ml-2">
                Donate ${config.tiers.find(t => t.id === selectedTier)?.amount}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Alternative Support */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Other Ways to Support
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-gray-50 rounded-lg p-4 flex-row items-center"
              onPress={() => {
                Alert.alert('Coming Soon', 'Rate us on the App Store to help others discover TheraJournal!');
              }}
            >
              <Ionicons name="star" size={24} color="#f59e0b" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Rate the App</Text>
                <Text className="text-gray-600 text-sm">Help others discover TheraJournal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-50 rounded-lg p-4 flex-row items-center"
              onPress={() => {
                Alert.alert('Coming Soon', 'Share TheraJournal with friends who might benefit from journaling!');
              }}
            >
              <Ionicons name="share-social" size={24} color="#8b5cf6" />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">Share with Friends</Text>
                <Text className="text-gray-600 text-sm">Help spread the word about privacy-first journaling</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="pb-8">
          <Text className="text-center text-gray-500 text-sm leading-5">
            TheraJournal is built with ❤️ by developers who believe in privacy and mental health.
            Your support helps us keep the lights on and the servers running.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
