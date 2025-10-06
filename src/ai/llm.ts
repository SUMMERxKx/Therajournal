import { SearchResult, MessagePlain, LLMResponse, PromptContext } from '../data/schemas';
import { MAX_CONTEXT_TOKENS, MAX_OUTPUT_TOKENS, CRISIS_KEYWORDS } from '../utils/constants';

// Simple token counter (rough estimation)
function countTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Crisis detection
function containsCrisisKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Build context from search results
function buildContextString(entries: SearchResult[], maxTokens: number): string {
  let context = '';
  let tokenCount = 0;

  for (const entry of entries) {
    const entryContext = `[${entry.entry_at.split('T')[0]}] "${entry.title}" - ${entry.body.substring(0, 150)}...`;
    const entryTokens = countTokens(entryContext);
    
    if (tokenCount + entryTokens > maxTokens) break;
    
    context += entryContext + '\n';
    tokenCount += entryTokens;
  }

  return context.trim();
}

// Build conversation history string
function buildConversationHistory(messages: MessagePlain[], maxTokens: number): string {
  let history = '';
  let tokenCount = 0;

  // Take last few messages to stay within token limit
  const recentMessages = messages.slice(-10);
  
  for (const message of recentMessages) {
    const messageText = `${message.role}: ${message.body}`;
    const messageTokens = countTokens(messageText);
    
    if (tokenCount + messageTokens > maxTokens) break;
    
    history += messageText + '\n';
    tokenCount += messageTokens;
  }

  return history.trim();
}

// Build system prompt
function buildSystemPrompt(): string {
  return `You are a thoughtful, reflective companion helping someone explore their thoughts and feelings through their journal entries. 

Guidelines:
- Be warm, empathetic, and non-judgmental
- Reference specific past entries when relevant (use dates and quotes)
- Ask thoughtful follow-up questions to encourage reflection
- Do NOT provide medical advice, therapy, or diagnosis
- Keep responses concise (under 200 tokens)
- Focus on patterns, insights, and gentle guidance
- If you notice concerning content, acknowledge it compassionately but don't probe deeply

Remember: You're helping them understand themselves better, not fixing them.`;
}

// Build main prompt
function buildPrompt(context: PromptContext): string {
  const systemPrompt = buildSystemPrompt();
  const contextString = buildContextString(context.entries, MAX_CONTEXT_TOKENS * 0.6);
  const conversationHistory = buildConversationHistory(context.conversationHistory, MAX_CONTEXT_TOKENS * 0.3);
  
  let prompt = systemPrompt + '\n\n';
  
  if (contextString) {
    prompt += 'Relevant past entries:\n' + contextString + '\n\n';
  }
  
  if (conversationHistory) {
    prompt += 'Recent conversation:\n' + conversationHistory + '\n\n';
  }
  
  prompt += 'Current message: ' + context.userMessage;
  
  return prompt;
}

// Response cache with rate limiting
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting (5 requests per minute per user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Token budgeting
const DAILY_TOKEN_LIMIT = 50000; // ~$2.50/day limit
const userTokenUsage = new Map<string, { tokens: number; resetDate: string }>();

// Check cache for identical requests
function getCachedResponse(prompt: string): string | null {
  const cached = responseCache.get(prompt);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  return null;
}

// Store response in cache
function cacheResponse(prompt: string, response: string): void {
  responseCache.set(prompt, {
    response,
    timestamp: Date.now()
  });
  
  // Clean old cache entries
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
}

// Check rate limiting
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}

// Check token budget
function checkTokenBudget(userId: string, estimatedTokens: number): boolean {
  const today = new Date().toISOString().split('T')[0];
  const usage = userTokenUsage.get(userId);
  
  if (!usage || usage.resetDate !== today) {
    // Reset daily usage
    userTokenUsage.set(userId, { tokens: estimatedTokens, resetDate: today });
    return true;
  }
  
  if (usage.tokens + estimatedTokens > DAILY_TOKEN_LIMIT) {
    return false; // Daily limit exceeded
  }
  
  usage.tokens += estimatedTokens;
  return true;
}

// Crisis response
function getCrisisResponse(): string {
  return `I notice you're going through something really difficult right now. Your feelings are valid and important.

While I'm here to listen and support you through your journaling, I'm not equipped to help with crisis situations. 

Please consider reaching out to:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Your local emergency services: 911

You don't have to face this alone. There are people who care and want to help.`;
}

// AI Provider types (only free options)
export type AIProvider = 'groq' | 'huggingface' | 'ollama';

export interface AIProviderConfig {
  name: AIProvider;
  baseUrl: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Main LLM service class
export class LLMService {
  private provider: AIProvider = 'groq'; // Default to free Groq
  private config: AIProviderConfig;

  constructor(provider: AIProvider = 'groq', apiKey?: string) {
    this.provider = provider;
    this.config = this.getProviderConfig(provider, apiKey);
  }

  setProvider(provider: AIProvider, apiKey?: string): void {
    this.provider = provider;
    this.config = this.getProviderConfig(provider, apiKey);
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  private getProviderConfig(provider: AIProvider, apiKey?: string): AIProviderConfig {
    const configs: Record<AIProvider, AIProviderConfig> = {
      // Production-optimized Groq configuration
      groq: {
        name: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3-8b-instant', // Production model
        maxTokens: 200,
        temperature: 0.6,
      },
      huggingface: {
        name: 'huggingface',
        baseUrl: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        model: 'microsoft/DialoGPT-medium',
        maxTokens: 200,
        temperature: 0.6,
      },
      ollama: {
        name: 'ollama',
        baseUrl: 'http://localhost:11434/v1', // Local Ollama server
        model: 'llama2:7b', // Free local model
        maxTokens: 200,
        temperature: 0.6,
      },
    };

    const config = configs[provider];
    if (apiKey) {
      config.apiKey = apiKey;
    }
    return config;
  }

  /**
   * Generate a response using the LLM
   */
  async generateResponse(context: PromptContext, userId: string): Promise<LLMResponse> {
    // Check for crisis keywords
    if (containsCrisisKeywords(context.userMessage)) {
      return {
        content: getCrisisResponse(),
        tokens: countTokens(getCrisisResponse()),
        cached: false
      };
    }

    const prompt = buildPrompt(context);
    const estimatedTokens = countTokens(prompt) + MAX_OUTPUT_TOKENS;
    
    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return {
        content: "I'm processing a lot of requests right now. Please wait a moment and try again.",
        tokens: 0,
        cached: false
      };
    }

    // Check token budget
    if (!checkTokenBudget(userId, estimatedTokens)) {
      return {
        content: "I've reached my daily conversation limit. Please try again tomorrow, or consider supporting the app to help cover AI costs! 💙",
        tokens: 0,
        cached: false
      };
    }
    
    // Check cache first
    const cachedResponse = getCachedResponse(prompt);
    if (cachedResponse) {
      return {
        content: cachedResponse,
        tokens: countTokens(cachedResponse),
        cached: true
      };
    }

    try {
      const response = await this.callLLM(prompt);
      
      // Cache the response
      cacheResponse(prompt, response);
      
      return {
        content: response,
        tokens: countTokens(response),
        cached: false
      };
    } catch (error) {
      console.error('LLM call failed:', error);
      
      // Fallback response
      const fallback = "I'm having trouble connecting right now. Your thoughts are important - maybe try writing them down in your journal while I work on getting back online.";
      
      return {
        content: fallback,
        tokens: countTokens(fallback),
        cached: false
      };
    }
  }

  /**
   * Call the actual LLM API
   */
  private async callLLM(prompt: string): Promise<string> {
    const { baseUrl, model, maxTokens, temperature, apiKey } = this.config;

    // Prepare headers based on provider
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      if (this.provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    // Prepare request body based on provider
    let requestBody: any;
    let endpoint: string;

    switch (this.provider) {
      case 'groq':
      case 'ollama':
        endpoint = `${baseUrl}/chat/completions`;
        requestBody = {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        };
        break;

      case 'huggingface':
        endpoint = baseUrl;
        requestBody = { inputs: prompt };
        break;

      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse response based on provider
      switch (this.provider) {
        case 'groq':
        case 'ollama':
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from LLM API');
          }
          return data.choices[0].message.content.trim();

        case 'huggingface':
          if (!data[0] || !data[0].generated_text) {
            throw new Error('Invalid response from Hugging Face API');
          }
          return data[0].generated_text.trim();

        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`LLM API call failed for ${this.provider}:`, error);
      throw error;
    }
  }

  /**
   * Generate a weekly reflection
   */
  async generateWeeklyReflection(entries: SearchResult[]): Promise<string> {
    const systemPrompt = `You are helping someone reflect on their week through their journal entries. 

Create a warm, encouraging summary that:
- Highlights positive patterns or growth
- Gently notes any recurring themes
- Suggests one small, actionable intention for the coming week
- Stays under 120 words
- Uses a supportive, non-judgmental tone

Don't provide therapy or medical advice. Focus on patterns and gentle encouragement.`;

    const entriesSummary = entries.map(entry => 
      `[${entry.entry_at.split('T')[0]}] Mood: ${entry.mood || 'N/A'} - ${entry.title}`
    ).join('\n');

    const prompt = `${systemPrompt}\n\nThis week's entries:\n${entriesSummary}`;

    try {
      return await this.callLLM(prompt);
    } catch (error) {
      console.error('Weekly reflection generation failed:', error);
      return "This week you've been reflecting and growing. Consider what small intention you'd like to set for the coming week.";
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    // All providers are free and don't need API keys
    return true;
  }

  /**
   * Get the current provider
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Get provider configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Get estimated cost for a request (always free!)
   */
  estimateCost(prompt: string): number {
    // All providers are completely free
    return 0;
  }

  /**
   * Test AI connection
   */
  async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const testPrompt = "Hello, this is a connection test. Please respond with 'Connection successful!'";
      await this.callLLM(testPrompt);
      const latency = Date.now() - startTime;
      
      return { success: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        success: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get provider info for display
   */
  getProviderInfo(): { name: string; free: boolean; description: string } {
    const info: Record<AIProvider, { name: string; free: boolean; description: string }> = {
      groq: {
        name: 'Groq',
        free: true,
        description: 'Fast, free AI with Llama models'
      },
      huggingface: {
        name: 'Hugging Face',
        free: true,
        description: 'Free AI models (limited requests)'
      },
      ollama: {
        name: 'Ollama (Local)',
        free: true,
        description: 'Run AI models on your device'
      }
    };
    return info[this.provider];
  }
}

// Singleton instance - default to free Groq
export const llmService = new LLMService('groq');
