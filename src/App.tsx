import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import AuthScreen from './screens/AuthScreen';
import WriteScreen from './screens/WriteScreen';
import ChatScreen from './screens/ChatScreen';
import ReflectScreen from './screens/ReflectScreen';
import SettingsScreen from './screens/SettingsScreen';
import DonationScreen from './screens/DonationScreen';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAppStore();

  useEffect(() => {
    // Skip authentication check for demo purposes
    // checkAuth();
  }, [checkAuth]);

  // Skip loading and authentication for demo
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
  //         <div className="text-gray-600">Loading TheraJournal...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // Skip authentication screen for demo
  // if (!isAuthenticated) {
  //   return <AuthScreen />;
  // }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/write" replace />} />
        <Route path="/write" element={<WriteScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/reflect" element={<ReflectScreen />} />
        <Route path="/support" element={<DonationScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </Layout>
  );
}

export default App;