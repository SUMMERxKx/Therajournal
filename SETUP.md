# TheraJournal - Setup Guide

## 🎉 Congratulations!

You now have a complete TheraJournal MVP ready for development! This is a privacy-first, AI-powered journaling app with end-to-end encryption.

## 📁 What You Have

### Core Features Implemented
- ✅ **Authentication**: Supabase Auth with encryption key setup
- ✅ **Write Screen**: Journal entry creation with mood tracking and tags
- ✅ **Chat Screen**: AI conversations about your entries with local search context
- ✅ **Reflect Screen**: Weekly analytics and AI-generated reflections
- ✅ **Settings Screen**: Configuration and privacy controls
- ✅ **Encryption**: AES-256-GCM encryption for all user data
- ✅ **Local Search**: MiniSearch BM25 indexing for fast, private search
- ✅ **State Management**: Zustand stores for clean state management

### Technical Architecture
- ✅ **Database Schema**: Complete Supabase schema with RLS policies
- ✅ **Type Safety**: Full TypeScript with Zod validation
- ✅ **Modern Stack**: React Native + Expo + NativeWind
- ✅ **Security**: Zero-knowledge encryption, crisis detection
- ✅ **Cost Optimization**: Token-limited AI, local search, free Supabase tier

## 🚀 Quick Start

### 1. Set Up Supabase
```bash
# Create a new Supabase project at https://supabase.com
# Run the SQL from supabase-schema.sql in your Supabase SQL editor
```

### 2. Configure Environment
```bash
# Run the setup script
npm run setup

# Or manually create .env file
cp env.example .env
# Edit .env with your Supabase credentials
```

### 3. Install and Start
```bash
npm install
npm start
```

## 🔧 Development Commands

```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web

# Quality
npm run type-check    # TypeScript type checking
npm run lint          # ESLint code linting

# Setup
npm run setup         # Interactive setup script
```

## 📱 App Structure

### Screens
- **AuthScreen**: Sign up/sign in with encryption setup
- **WriteScreen**: Create journal entries with mood and tags
- **ChatScreen**: AI conversations with journal context
- **ReflectScreen**: Weekly insights and analytics
- **SettingsScreen**: App configuration and privacy controls

### Key Components
- **Encryption**: All user data encrypted with AES-256-GCM
- **Search**: Local BM25 search index for fast, private search
- **AI**: GPT-4o-mini integration with token limits and caching
- **State**: Zustand stores for clean state management

## 🔐 Security Features

- **End-to-End Encryption**: All entries and messages encrypted on device
- **Zero-Knowledge**: Server only sees ciphertext
- **Row-Level Security**: Supabase RLS ensures data isolation
- **Crisis Detection**: Automatic detection with resource links
- **Local Search**: No cloud embeddings, search happens locally

## 💰 Cost Structure

- **Supabase**: Free tier supports early users
- **AI**: <$1-3 per 1,000 conversations (GPT-4o-mini + token limits)
- **Infrastructure**: Near-zero cost with current architecture

## 🎯 Next Steps

### Immediate (Ready to Use)
1. Set up Supabase project and run schema
2. Configure environment variables
3. Install dependencies and start development
4. Test all features on device/simulator

### Phase 1 Enhancements
- Add voice-to-text journaling
- Implement offline queue for entries
- Add data export functionality
- Create proper app icons and splash screens

### Phase 2 Features
- Advanced analytics and insights
- Multi-device sync with passphrase
- Desktop app (Electron)
- Therapy integration

## 🐛 Troubleshooting

### Common Issues
1. **Supabase Connection**: Check URL and anon key in .env
2. **Encryption Errors**: Ensure device supports Web Crypto API
3. **AI Not Working**: Verify OpenAI API key in settings
4. **Build Issues**: Run `npx expo install --fix` to resolve dependencies

### Getting Help
- Check the main README.md for detailed documentation
- Review the SQL schema in supabase-schema.sql
- Look at the TypeScript types in src/utils/types.ts
- Check the encryption utilities in src/crypto/encryption.ts

## 🎨 Customization

### Styling
- Uses NativeWind (Tailwind CSS for React Native)
- Customize colors in tailwind.config.js
- Modify components in src/screens/ and src/components/

### Features
- Add new screens in src/screens/
- Extend state management in src/store/
- Add new API endpoints in src/data/queries.ts

### Security
- Modify encryption in src/crypto/encryption.ts
- Update crisis detection in src/ai/llm.ts
- Adjust RLS policies in supabase-schema.sql

## 🚀 Deployment

### App Stores
1. Configure bundle IDs in app.json
2. Build with EAS Build: `eas build --platform all`
3. Submit to App Store/Play Store

### Production Checklist
- [ ] Replace placeholder assets with real icons
- [ ] Set up production Supabase project
- [ ] Configure app store metadata
- [ ] Test all features on physical devices
- [ ] Set up monitoring and analytics

## 📊 Success Metrics

### User Engagement
- Daily active users
- Entries per week per user
- Chat conversations per user
- Weekly reflection usage

### Technical Health
- App crash rate
- Sync success rate
- AI response time
- Search performance

### Privacy & Security
- Encryption coverage (should be 100%)
- Data breach incidents (should be 0)
- User privacy complaints (should be 0)

---

**🎉 You're ready to build and ship TheraJournal!**

This MVP provides a solid foundation for a privacy-first journaling app. The architecture is designed to scale while maintaining security and keeping costs low.

Happy coding! 🚀
