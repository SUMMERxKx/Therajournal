# TheraJournal - Complete Application Overview

## 🎯 **What is TheraJournal?**

TheraJournal is a **privacy-first, AI-powered journaling web application** that combines traditional journaling with modern AI technology while maintaining complete user privacy through end-to-end encryption. It's designed for people who want to reflect on their thoughts and feelings with AI assistance, but don't want to compromise their privacy.

## 🔒 **Core Philosophy: Privacy First**

- **Zero-Knowledge Architecture**: The app developers cannot read your data
- **End-to-End Encryption**: All your thoughts are encrypted on your device before being stored
- **Local Processing**: Search and AI context building happens on your device
- **No Data Mining**: Your personal thoughts are never used for training or analytics

## 🏗️ **Technical Architecture**

### **Frontend (Web Application)**
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: Zustand for global state, TanStack Query for server state
- **Navigation**: React Router for web-based navigation
- **Build Tool**: Vite for fast development and optimized production builds

### **Backend & Database**
- **Database**: Supabase (PostgreSQL) for data storage
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **API**: Direct Supabase client integration (no custom backend needed)
- **Storage**: Encrypted data in Supabase with client-side encryption

### **AI & Search**
- **AI Providers**: Groq (Llama), Hugging Face, Ollama (local) - all completely free
- **Search Engine**: MiniSearch (BM25 algorithm) for local, private search
- **Encryption**: Web Crypto API (AES-256-GCM) for military-grade encryption
- **Local Storage**: IndexedDB + localStorage for offline functionality

## 📱 **Main Application Screens**

### **1. Authentication Screen (`AuthScreen.tsx`)**
**Purpose**: Secure user onboarding with encryption setup

**Features**:
- Email/password authentication via Supabase
- Two-step setup: authentication + encryption key setup
- Two encryption options:
  - **Device Keystore**: Simple, keys stored in browser session
  - **Passphrase**: Advanced, keys derived from user's passphrase
- Form validation and error handling
- Clean, modern UI with security icons

**User Flow**:
1. User enters email/password (sign up or sign in)
2. If new user, proceeds to encryption key setup
3. Chooses encryption method (device or passphrase)
4. Keys are generated and stored securely
5. User is redirected to main application

### **2. Write Screen (`WriteScreen.tsx`)**
**Purpose**: Create and manage encrypted journal entries

**Features**:
- **Rich Text Input**: Title and body fields (up to 50,000 characters)
- **Mood Tracking**: Slider from -5 (very low) to +5 (very good) with color coding
- **Tag System**: Add up to 10 tags (50 characters each) for organization
- **Auto-save**: Drafts are saved automatically as you type
- **Real-time Validation**: Immediate feedback on form inputs
- **Encryption**: All data encrypted locally before database storage

**User Flow**:
1. User opens Write tab
2. Enters title and content
3. Optionally sets mood and adds tags
4. Clicks "Save Entry"
5. Data is encrypted locally → sent to Supabase → added to local search index
6. Success confirmation and form reset

**Technical Implementation**:
- `useWriteStore` for form state management
- `EntryQueries.createEntry()` for database operations
- `encrypt()` function for AES-GCM encryption
- `searchIndexer.addEntry()` for local indexing

### **3. Chat Screen (`ChatScreen.tsx`)**
**Purpose**: AI-powered conversations about journal entries with context

**Features**:
- **Conversation Management**: Create, list, and switch between conversations
- **AI Context Building**: Automatically finds relevant past entries for context
- **Multiple AI Providers**: Groq (default), Hugging Face, Ollama (local)
- **Message History**: All messages encrypted and stored
- **Crisis Detection**: Automatic detection of concerning content with resource links
- **Real-time Chat**: Instant messaging interface with typing indicators

**User Flow**:
1. User opens Chat tab
2. Starts new conversation or selects existing one
3. Types question about their journal entries
4. App searches local index for relevant entries (top 8 matches)
5. Builds context from matching entries with dates and quotes
6. Calls AI provider with context + user message
7. Displays AI response and stores both messages encrypted
8. User can continue the conversation

**AI Context Building**:
- **BM25 Search**: Finds most relevant entries using local search
- **Recency Boost**: Recent entries are weighted higher
- **Mood Bias**: Favors entries with similar mood to current context
- **Token Limits**: 500 context + 200 output tokens maximum
- **Crisis Detection**: Automatic resource links for concerning content

### **4. Reflect Screen (`ReflectScreen.tsx`)**
**Purpose**: Generate insights and analytics from journal entries

**Features**:
- **Entry Statistics**: Total entries, average mood, writing frequency
- **Mood Trends**: Visual charts showing mood over time
- **Top Keywords**: Most frequently used words and phrases
- **Weekly Reflections**: AI-generated summaries of the week
- **Local Analytics**: All processing happens on device (no cloud analytics)

**User Flow**:
1. User opens Reflect tab
2. Views local statistics (entries, mood trends, keywords)
3. Optionally generates AI reflection for the week
4. Receives personalized weekly summary with insights
5. Can view historical trends and patterns

**Technical Implementation**:
- Local data aggregation from search index
- `llmService.generateWeeklyReflection()` for AI summaries
- Chart visualization for mood trends
- Keyword frequency analysis from local data

### **5. Settings Screen (`SettingsScreen.tsx`)**
**Purpose**: App configuration and privacy controls

**Features**:
- **AI Provider Selection**: Choose between Groq, Hugging Face, or Ollama
- **Theme Preferences**: Light, dark, or auto theme switching
- **Notification Settings**: Configure app notifications
- **Security Controls**: Reset encryption keys, change password
- **Data Management**: Export data, clear cache
- **Account Management**: Logout, password reset
- **Donation Support**: Support the app development

**User Flow**:
1. User opens Settings tab
2. Configures AI provider (all options are free)
3. Adjusts app preferences (theme, notifications)
4. Manages security settings (keys, password)
5. Can export data or clear cache if needed

### **6. Donation Screen (`DonationScreen.tsx`)**
**Purpose**: Support the app development and sustainability

**Features**:
- **Donation Tiers**: $2 (Coffee), $5 (Lunch), $10 (Dinner), $25 (Sponsor)
- **PayPal Integration**: Secure payment processing
- **Supporter Benefits**: Enhanced AI limits, special recognition
- **Transparency**: Clear cost breakdown and impact messaging
- **Alternative Support**: App rating, sharing with friends

## 🔐 **Security Implementation**

### **Encryption Flow**
1. **Key Generation**: AES-256-GCM key generated on device
2. **Key Storage**: 
   - **Option 1**: SessionStorage (simple, cleared on browser close)
   - **Option 2**: Passphrase-wrapped with PBKDF2 (cross-session)
3. **Data Encryption**: All text fields encrypted before database storage
4. **Zero-Knowledge**: Server only sees ciphertext + IV, never plaintext

### **Data Protection**
- **Row Level Security**: Supabase RLS policies ensure user data isolation
- **Client-Side Encryption**: All sensitive data encrypted before transmission
- **Local Search**: Search index stored locally, never sent to server
- **Crisis Detection**: On-device keyword detection for safety

### **Crisis Safety**
- Automatic detection of concerning content (suicidal thoughts, self-harm)
- Non-blocking - user can still journal
- Automatic display of crisis resources (988, Crisis Text Line)
- Compassionate, supportive responses

## 💰 **Cost Optimization**

### **AI Usage**
- **Providers**: Groq (Llama), Hugging Face, Ollama (local)
- **Cost**: Completely FREE! No API keys or payments required
- **Token Limits**: 500 context + 200 output tokens maximum
- **Caching**: 5-minute cache for identical requests
- **Rate Limiting**: 5 requests per minute per user

### **Infrastructure**
- **Supabase**: Free tier supports early users
- **No Vector DB**: Uses local BM25 instead of expensive embeddings
- **Static Hosting**: Can be deployed to Vercel, Netlify, etc.
- **No Custom Backend**: Direct Supabase integration reduces costs

## 📊 **Database Schema**

### **Tables Structure**

#### `users` table
- `user_id` (UUID, PK, references auth.users)
- `created_at` (TIMESTAMPTZ)
- `tz` (TEXT, default: 'America/Vancouver')

#### `entries` table
- `id` (UUID, PK)
- `user_id` (UUID, FK to users)
- `created_at` (TIMESTAMPTZ)
- `entry_at` (TIMESTAMPTZ)
- `mood` (SMALLINT, -5 to +5)
- `title_enc` (BYTEA) - encrypted title
- `body_enc` (BYTEA) - encrypted body
- `iv` (BYTEA) - encryption initialization vector
- `tags_enc` (BYTEA) - encrypted JSON array of tags
- `deleted_at` (TIMESTAMPTZ) - soft delete

#### `conversations` table
- `id` (UUID, PK)
- `user_id` (UUID, FK to users)
- `created_at` (TIMESTAMPTZ)
- `title_enc` (BYTEA) - encrypted title
- `iv` (BYTEA) - encryption IV

#### `messages` table
- `id` (UUID, PK)
- `conversation_id` (UUID, FK to conversations)
- `user_id` (UUID, FK to users)
- `created_at` (TIMESTAMPTZ)
- `role` (TEXT, 'user' or 'assistant')
- `body_enc` (BYTEA) - encrypted message body
- `iv` (BYTEA) - encryption IV

## 🚀 **User Flows**

### **Daily Journaling Flow**
1. User opens Write tab
2. Adds title, content, mood, tags
3. Saves → encrypts locally → syncs to Supabase → updates search index
4. Can immediately search or chat about the entry

### **AI Chat Flow**
1. User opens Chat tab
2. Types question about past entries
3. MiniSearch finds relevant entries locally
4. LLM generates response with context from entries
5. Both messages encrypted and stored
6. Conversation continues with full context

### **Weekly Reflection Flow**
1. User opens Reflect tab
2. Views local analytics (entries, mood, keywords)
3. Generates AI summary of the week
4. Gets actionable insights and patterns
5. Can track progress over time

### **Authentication Flow**
1. User signs up with email/password
2. Chooses encryption method (device or passphrase)
3. Encryption keys generated and stored
4. User profile created in database
5. Redirected to main app with full functionality

## 🎯 **Key Features Summary**

### **Core Features**
- ✅ **Encrypted Journaling**: Write entries with mood tracking and tags
- ✅ **AI Chat**: Conversations about entries with context from past entries
- ✅ **Weekly Reflections**: AI-generated insights and analytics
- ✅ **Local Search**: Fast, private search through all entries
- ✅ **Offline-First**: Works without internet connection
- ✅ **Crisis Detection**: Automatic safety resources for concerning content

### **Technical Features**
- ✅ **End-to-End Encryption**: AES-256-GCM for all user data
- ✅ **Zero-Knowledge Architecture**: Developers cannot read user data
- ✅ **Local Indexing**: BM25 search index stored locally
- ✅ **Token-Limited AI**: Cost-conscious LLM usage with strict caps
- ✅ **Row-Level Security**: Database-level user data isolation
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile

### **AI Features**
- ✅ **Multiple Free Providers**: Groq, Hugging Face, Ollama
- ✅ **Context-Aware Responses**: Uses relevant past entries for context
- ✅ **Crisis Detection**: Automatic safety resource links
- ✅ **Weekly Summaries**: AI-generated insights from entries
- ✅ **Cost Optimization**: Token limits and caching

## 🔮 **Development Roadmap**

### **Phase 1 (Current - Complete)**
- ✅ Core journaling with encryption
- ✅ AI chat with local search
- ✅ Weekly reflections
- ✅ Web application
- ✅ Production-ready deployment

### **Phase 2 (Future)**
- Voice-to-text journaling
- Advanced analytics and insights
- Multi-device sync with passphrase
- Progressive Web App (PWA)
- Mobile app versions

### **Phase 3 (Advanced)**
- Vector embeddings for better search
- Custom AI models
- Therapy integration
- Community features (optional)

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase account

### **Quick Start**
```bash
# 1. Clone and install
git clone <repository-url>
cd TheraJournal
npm install

# 2. Set up Supabase
# - Create new Supabase project
# - Run supabase-schema.sql in SQL editor
# - Copy URL and anon key

# 3. Configure environment
cp env.example .env
# Edit .env with Supabase credentials

# 4. Start development
npm run dev
```

### **Environment Variables**
```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### **Netlify**
1. Connect GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main

### **Manual Deployment**
1. Build: `npm run build`
2. Upload `dist` folder to web server
3. Configure environment variables

## 💡 **Why TheraJournal is Special**

### **Privacy-First Design**
- Your thoughts are encrypted before leaving your device
- No data mining or analytics on personal content
- Local search means your entries never leave your device
- Zero-knowledge architecture ensures even developers can't read your data

### **AI-Powered Insights**
- Get meaningful insights from your journal entries
- AI understands context from your past entries
- Completely free AI providers (no API costs)
- Crisis detection for mental health safety

### **Modern Technology**
- Built with latest web technologies (React 18, TypeScript, Vite)
- Responsive design works on all devices
- Offline-first architecture
- Production-ready with proper error handling

### **Cost-Effective**
- Completely free to run (uses free tiers)
- No expensive vector databases
- Local processing reduces server costs
- Sustainable for long-term operation

## 🎯 **Target Users**

### **Primary Users**
- **Journal Writers**: People who want to reflect on their thoughts
- **Privacy-Conscious Users**: Those who value data privacy
- **AI Enthusiasts**: People interested in AI-assisted reflection
- **Mental Health Advocates**: Those seeking safe, supportive tools

### **Use Cases**
- **Daily Reflection**: Regular journaling with mood tracking
- **Therapeutic Writing**: Processing thoughts and feelings
- **Pattern Recognition**: Understanding personal trends and behaviors
- **Crisis Support**: Safe space for difficult thoughts with resources
- **Personal Growth**: AI-assisted insights for self-improvement

## 📈 **Success Metrics**

### **User Engagement**
- Daily active users
- Entries per user per week
- AI chat interactions
- Weekly reflection usage

### **Technical Performance**
- Encryption/decryption speed
- Search response time
- AI response quality
- Offline functionality

### **Privacy & Security**
- Zero data breaches
- Successful encryption audits
- User trust and adoption
- Compliance with privacy regulations

---

**TheraJournal represents the future of private, AI-assisted journaling - where cutting-edge technology meets uncompromising privacy to help people understand themselves better while keeping their most personal thoughts completely secure.**
