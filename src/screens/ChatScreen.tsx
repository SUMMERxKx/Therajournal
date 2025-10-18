import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Bot, User } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { llmService } from '../ai/llm';
import { useAppStore } from '../store/appStore';
import { searchIndexer } from '../search/indexer';
import { encrypt, decrypt } from '../crypto/encryption';
import { MessageQueries } from '../data/queries';
import logger from '../utils/logger';

export default function ChatScreen() {
  const { user, encryptionKey } = useAppStore();
  const {
    currentConversation,
    conversations,
    messages,
    setCurrentConversation,
    addMessage,
    createConversation,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !encryptionKey || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to conversation
      const userMsg = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversation?.id || '',
        user_id: user.user_id,
        role: 'user' as const,
        body: userMessage,
        created_at: new Date().toISOString(),
      };

      addMessage(userMsg);

      // Search for relevant entries
      const searchResults = await searchIndexer.search(userMessage, 8);
      
      // Get conversation history
      const conversationHistory = messages.slice(-10); // Last 10 messages

      // Generate AI response
      const aiResponse = await llmService.generateResponse(
        {
          entries: searchResults,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            body: msg.body,
            created_at: msg.created_at,
          })),
          userMessage,
          maxTokens: 200,
        },
        user.user_id
      );

      // Add AI message
      const aiMsg = {
        id: `temp-ai-${Date.now()}`,
        conversation_id: currentConversation?.id || '',
        user_id: user.user_id,
        role: 'assistant' as const,
        body: aiResponse.content,
        created_at: new Date().toISOString(),
      };

      addMessage(aiMsg);

      // Save both messages to database
      if (currentConversation) {
        // Encrypt and save user message
        const encryptedUserBody = await encrypt(userMessage, encryptionKey);
        await MessageQueries.createMessage({
          conversation_id: currentConversation.id,
          user_id: user.user_id,
          role: 'user',
          body_enc: encryptedUserBody.ciphertext,
          iv: encryptedUserBody.iv,
        });

        // Encrypt and save AI message
        const encryptedAiBody = await encrypt(aiResponse.content, encryptionKey);
        await MessageQueries.createMessage({
          conversation_id: currentConversation.id,
          user_id: user.user_id,
          role: 'assistant',
          body_enc: encryptedAiBody.ciphertext,
          iv: encryptedAiBody.iv,
        });
      }

    } catch (error) {
      logger.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;

    try {
      const conversation = await createConversation(user.user_id, 'New Conversation');
      setCurrentConversation(conversation);
    } catch (error) {
      logger.error('Failed to create conversation:', error);
      setError('Failed to create new conversation');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Chat</h1>
        <p className="text-gray-600">Talk about your journal entries with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <button
                onClick={handleNewConversation}
                className="btn btn-primary text-sm"
              >
                New Chat
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversation?.id === conv.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <div className="card h-full flex flex-col">
            {currentConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start a conversation about your journal entries</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            {message.role === 'user' && (
                              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.role === 'user' ? 'text-primary-200' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your journal entries..."
                    className="input flex-1"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a conversation or start a new one</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}