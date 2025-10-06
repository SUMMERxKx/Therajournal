import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useChatStore } from '../store/chatStore';
import { useAppStore } from '../store/appStore';
import { ConversationQueries, MessageQueries } from '../data/queries';
import { searchIndexer } from '../search/indexer';
import { llmService } from '../ai/llm';
import { MessagePlain, ConversationPlain } from '../data/schemas';

interface ChatMessage extends MessagePlain {
  isLoading?: boolean;
}

export default function ChatScreen() {
  const { 
    currentConversation, 
    conversations, 
    messages, 
    isGenerating,
    setCurrentConversation,
    addConversation,
    addMessage,
    setGenerating,
    getCurrentMessages
  } = useChatStore();
  
  const { user, encryptionKey } = useAppStore();
  
  const [messageInput, setMessageInput] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    if (!user || !encryptionKey) return;

    try {
      const encryptedConversations = await ConversationQueries.getConversations(user.user_id);
      const decryptedConversations = await Promise.all(
        encryptedConversations.map(conv => 
          ConversationQueries.decryptConversation(conv, encryptionKey)
        )
      );

      decryptedConversations.forEach(conv => {
        addConversation(conv);
      });

      // Load messages for each conversation
      for (const conv of decryptedConversations) {
        const encryptedMessages = await MessageQueries.getMessages(conv.id);
        const decryptedMessages = await MessageQueries.decryptMessages(encryptedMessages, encryptionKey);
        // Set messages in store
        useChatStore.getState().setMessages(conv.id, decryptedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const startNewConversation = async () => {
    if (!user || !encryptionKey) return;

    try {
      const conversation = await ConversationQueries.createConversation(
        user.user_id,
        { title: 'New Chat' },
        encryptionKey
      );

      const decryptedConversation = await ConversationQueries.decryptConversation(
        conversation, 
        encryptionKey
      );

      addConversation(decryptedConversation);
      setCurrentConversation(decryptedConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to start new conversation');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !encryptionKey) return;

    const userMessage = messageInput.trim();
    setMessageInput('');

    // Start new conversation if none exists
    let conversationId = currentConversation;
    if (!conversationId) {
      try {
        const conversation = await ConversationQueries.createConversation(
          user.user_id,
          { title: userMessage.substring(0, 50) },
          encryptionKey
        );

        const decryptedConversation = await ConversationQueries.decryptConversation(
          conversation, 
          encryptionKey
        );

        addConversation(decryptedConversation);
        conversationId = decryptedConversation.id;
        setCurrentConversation(conversationId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        Alert.alert('Error', 'Failed to start conversation');
        return;
      }
    }

    // Add user message
    const userMessageData: MessagePlain = {
      id: Date.now().toString(), // Temporary ID
      conversation_id: conversationId,
      user_id: user.user_id,
      created_at: new Date().toISOString(),
      role: 'user',
      body: userMessage,
    };

    addMessage(conversationId, userMessageData);

    // Save user message to database
    try {
      await MessageQueries.createMessage(user.user_id, {
        conversation_id: conversationId,
        role: 'user',
        body: userMessage,
      }, encryptionKey);
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Generate AI response
    await generateAIResponse(conversationId, userMessage);
  };

  const generateAIResponse = async (conversationId: string, userMessage: string) => {
    if (!encryptionKey) return;

    setGenerating(true);

    try {
      // Search for relevant entries
      const searchResults = await searchIndexer.search({
        query: userMessage,
        limit: 8,
      });

      // Get conversation history
      const conversationMessages = getCurrentMessages();

      // Generate AI response
      const response = await llmService.generateResponse({
        entries: searchResults,
        conversationHistory: conversationMessages,
        userMessage,
        maxTokens: 200,
      }, user.user_id);

      // Add AI message
      const aiMessageData: MessagePlain = {
        id: (Date.now() + 1).toString(), // Temporary ID
        conversation_id: conversationId,
        user_id: user!.user_id,
        created_at: new Date().toISOString(),
        role: 'assistant',
        body: response.content,
      };

      addMessage(conversationId, aiMessageData);

      // Save AI message to database
      await MessageQueries.createMessage(user!.user_id, {
        conversation_id: conversationId,
        role: 'assistant',
        body: response.content,
      }, encryptionKey);

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      // Add error message
      const errorMessage: MessagePlain = {
        id: (Date.now() + 1).toString(),
        conversation_id: conversationId,
        user_id: user!.user_id,
        created_at: new Date().toISOString(),
        role: 'assistant',
        body: "I'm having trouble connecting right now. Please try again in a moment.",
      };

      addMessage(conversationId, errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View className={`mb-4 ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          item.role === 'user'
            ? 'bg-blue-500'
            : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-sm ${
            item.role === 'user' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {item.body}
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1">
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderConversationItem = ({ item }: { item: ConversationPlain }) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-200 ${
        currentConversation === item.id ? 'bg-blue-50' : ''
      }`}
      onPress={() => setCurrentConversation(item.id)}
    >
      <Text className="font-medium text-gray-900" numberOfLines={1}>
        {item.title || 'Untitled Chat'}
      </Text>
      <Text className="text-sm text-gray-500 mt-1">
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const currentMessages = currentConversation ? (messages[currentConversation] || []) : [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => setShowConversations(!showConversations)}
        >
          <Ionicons name="menu" size={24} color="#374151" />
          <Text className="ml-2 font-medium text-gray-900">
            {currentConversation ? 'Chat' : 'Conversations'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-blue-500 rounded-full p-2"
          onPress={startNewConversation}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {showConversations ? (
        // Conversations List
        <View className="flex-1">
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center p-8">
                <Ionicons name="chatbubbles-outline" size={64} color="#9ca3af" />
                <Text className="text-gray-500 text-center mt-4">
                  No conversations yet.{'\n'}Start a new chat to begin!
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        // Chat Interface
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {currentConversation ? (
            <>
              {/* Messages */}
              <FlatList
                ref={flatListRef}
                className="flex-1 px-4"
                data={currentMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center p-8">
                    <Ionicons name="chatbubble-outline" size={64} color="#9ca3af" />
                    <Text className="text-gray-500 text-center mt-4">
                      Start a conversation!{'\n'}Ask me anything about your journal entries.
                    </Text>
                  </View>
                }
              />

              {/* Message Input */}
              <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-3"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChangeText={setMessageInput}
                  multiline
                  maxLength={4000}
                />
                <TouchableOpacity
                  className={`rounded-full p-3 ${
                    !messageInput.trim() || isGenerating
                      ? 'bg-gray-300'
                      : 'bg-blue-500'
                  }`}
                  onPress={sendMessage}
                  disabled={!messageInput.trim() || isGenerating}
                >
                  <Ionicons 
                    name={isGenerating ? "hourglass-outline" : "send"} 
                    size={20} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Welcome Screen
            <View className="flex-1 justify-center items-center p-8">
              <Ionicons name="chatbubbles" size={80} color="#0ea5e9" />
              <Text className="text-2xl font-bold text-gray-900 mt-4">
                Chat with Your Journal
              </Text>
              <Text className="text-gray-600 text-center mt-2 mb-8">
                Ask questions about your past entries, explore patterns, or just have a conversation about your thoughts and feelings.
              </Text>
              <TouchableOpacity
                className="bg-blue-500 rounded-lg px-6 py-3"
                onPress={startNewConversation}
              >
                <Text className="text-white font-medium">Start New Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
