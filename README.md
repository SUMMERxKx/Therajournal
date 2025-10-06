# TheraJournal

A privacy-first, AI-powered journaling app built with React Native and Expo. Your thoughts stay encrypted on your device, and AI helps you reflect on patterns in your entries.

## 🔒 Privacy & Security

- **End-to-End Encryption**: All entries and messages are encrypted on your device using AES-256-GCM
- **Zero-Knowledge Architecture**: We can't read your data - only you can decrypt it
- **Local Search**: Uses MiniSearch (BM25) for fast, private search without cloud embeddings
- **Row-Level Security**: Supabase RLS ensures users can only access their own data

## ✨ Features

### Core Features
- **Write**: Create encrypted journal entries with mood tracking and tags
- **Chat**: AI-powered conversations about your journal entries (with context from past entries)
- **Reflect**: Weekly insights and analytics based on your entries
- **Search**: Fast local search through all your entries

### Technical Features
- **Offline-First**: Works without internet connection
- **Local Indexing**: BM25 search index stored locally for instant search
- **Token-Limited AI**: Cost-conscious LLM usage with strict token caps
- **Crisis Detection**: Automatic detection of concerning content with resource links

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd TheraJournal
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

3. **Configure Environment**
   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start Development**
   ```bash
   npm start
   ```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native (Expo) + TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **State**: Zustand + TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Search**: MiniSearch (BM25)
- **AI**: Groq, Hugging Face, Ollama (all free!)
- **Encryption**: Web Crypto API (AES-GCM)

### Project Structure
```
src/
├── api/           # Supabase client and database types
├── auth/          # Authentication and key management
├── crypto/        # Encryption utilities
├── data/          # Database queries and Zod schemas
├── search/        # MiniSearch indexing and retrieval
├── ai/            # LLM integration and prompt management
├── screens/       # React Native screens
├── components/    # Reusable UI components
├── store/         # Zustand state management
└── utils/         # Types and constants
```

## 🔐 Security Implementation

### Encryption Flow
1. **Key Generation**: AES-256-GCM key generated on device
2. **Key Storage**: 
   - Option 1: Device keystore (simple, device-dependent)
   - Option 2: Passphrase-wrapped with Argon2id (cross-device)
3. **Data Encryption**: All text fields encrypted before database storage
4. **Zero-Knowledge**: Server only sees ciphertext + IV

### Crisis Safety
- On-device keyword detection for crisis content
- Automatic display of crisis resources (988, Crisis Text Line)
- Non-blocking - user can still journal

## 💰 Cost Optimization

### AI Usage
- **Providers**: Groq (Llama), Hugging Face, Ollama (local)
- **Cost**: Completely FREE! No API keys or payments required
- **Token Limits**: 500 context + 200 output tokens max
- **Caching**: 5-minute cache for identical requests

### Infrastructure
- **Supabase**: Free tier supports early users
- **No Vector DB**: Uses local BM25 instead of embeddings
- **Edge Functions**: Near-free at small scale

## 📱 User Flows

### Daily Journaling
1. Open Write tab
2. Add title, content, mood, tags
3. Save → encrypts locally → syncs to Supabase → updates search index

### AI Chat
1. Open Chat tab
2. Type question about past entries
3. MiniSearch finds relevant entries
4. LLM generates response with context
5. Both messages encrypted and stored

### Weekly Reflection
1. Open Reflect tab
2. View local analytics (entries, mood, keywords)
3. Generate AI summary of the week
4. Get actionable insights

## 🔧 Development

### Adding Features
1. **New Screens**: Add to `src/screens/`
2. **State Management**: Use Zustand stores in `src/store/`
3. **API Calls**: Add to `src/data/queries.ts`
4. **Encryption**: Use utilities from `src/crypto/`

### Testing
- Unit tests for crypto functions
- Integration tests for Supabase queries
- E2E tests for complete user flows

### Building
```bash
# Android
npm run build:android

# iOS  
npm run build:ios
```

## 🚀 Deployment

### Supabase Setup
1. Create project and run schema
2. Configure RLS policies
3. Set up auth providers
4. Add environment variables

### App Store
1. Configure app.json with bundle IDs
2. Build with EAS Build
3. Submit to App Store/Play Store

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow security best practices
4. Add tests for new features
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Crisis Resources**: 988 (Suicide & Crisis Lifeline)
- **Technical Issues**: Create GitHub issue
- **Feature Requests**: Use GitHub discussions

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core journaling with encryption
- ✅ AI chat with local search
- ✅ Weekly reflections
- ✅ Mobile app (iOS/Android)

### Phase 2 (Future)
- Voice-to-text journaling
- Advanced analytics and insights
- Multi-device sync with passphrase
- Desktop app (Electron)

### Phase 3 (Advanced)
- Vector embeddings for better search
- Custom AI models
- Therapy integration
- Community features (optional)

---

**Built with ❤️ for mental health and privacy**
