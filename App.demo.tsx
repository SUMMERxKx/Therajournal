import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import demo screens
import WriteScreen from './src/screens/WriteScreen';
import ChatScreen from './src/screens/ChatScreen';
import ReflectScreen from './src/screens/ReflectScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DonationScreen from './src/screens/DonationScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Write') {
                iconName = focused ? 'create' : 'create-outline';
              } else if (route.name === 'Chat') {
                iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              } else if (route.name === 'Reflect') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else if (route.name === 'Support') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else {
                iconName = 'circle-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#0ea5e9',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopColor: '#e5e7eb',
            },
            headerStyle: {
              backgroundColor: 'white',
              borderBottomColor: '#e5e7eb',
            },
            headerTintColor: '#1f2937',
            headerTitleStyle: {
              fontWeight: '600',
            },
          })}
        >
          <Tab.Screen 
            name="Write" 
            component={WriteScreen}
            options={{ title: 'Write' }}
          />
          <Tab.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Tab.Screen 
            name="Reflect" 
            component={ReflectScreen}
            options={{ title: 'Reflect' }}
          />
          <Tab.Screen 
            name="Support" 
            component={DonationScreen}
            options={{ title: 'Support' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
