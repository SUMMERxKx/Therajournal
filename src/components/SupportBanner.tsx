import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDonationStore } from '../store/donationStore';

interface SupportBannerProps {
  onPress?: () => void;
}

export default function SupportBanner({ onPress }: SupportBannerProps) {
  const { shouldShowBanner, hideBanner, markBannerShown } = useDonationStore();

  if (!shouldShowBanner()) {
    return null;
  }

  return (
    <View className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-4 mb-4 rounded-r-lg">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <Ionicons name="heart" size={20} color="#0ea5e9" />
          <View className="ml-2 flex-1">
            <Text className="font-medium text-blue-900">
              Support TheraJournal ❤️
            </Text>
            <Text className="text-sm text-blue-800 mt-1">
              Help keep the app free and ad-free
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-blue-500 rounded-full px-3 py-1 mr-2"
            onPress={onPress}
          >
            <Text className="text-white text-sm font-medium">Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-1"
            onPress={() => {
              hideBanner();
              markBannerShown();
            }}
          >
            <Ionicons name="close" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
