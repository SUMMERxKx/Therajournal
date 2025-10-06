# 🆓 Free AI Setup Guide

TheraJournal now uses **100% free AI providers**! No API keys, no payments, no limits on your wallet.

## 🤖 Available Free AI Providers

### 1. **Groq** (Default - Recommended)
- **What**: Fast, free AI with Llama models
- **Setup**: No setup required - works out of the box!
- **Speed**: Very fast responses
- **Quality**: Excellent for journaling conversations
- **Limits**: Generous free tier

### 2. **Hugging Face**
- **What**: Free AI models with limited requests
- **Setup**: No API key needed
- **Speed**: Moderate
- **Quality**: Good for basic conversations
- **Limits**: Rate limited but free

### 3. **Ollama (Local)**
- **What**: Run AI models on your device
- **Setup**: Requires installing Ollama locally
- **Speed**: Depends on your device
- **Quality**: Excellent, fully private
- **Limits**: None - completely offline

## 🚀 Quick Start

The app defaults to **Groq** which works immediately without any setup!

1. **Install and run**: `npm install && npm start`
2. **Start chatting**: The AI will work right away
3. **Change provider**: Go to Settings → AI Settings to switch providers

## 🔧 Ollama Setup (Optional)

If you want to run AI locally on your device:

### Install Ollama
```bash
# macOS
brew install ollama

# Windows
# Download from https://ollama.ai/download

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### Install a Model
```bash
# Install Llama 2 (recommended)
ollama pull llama2:7b

# Or install a smaller model
ollama pull llama2:7b-chat
```

### Start Ollama Server
```bash
ollama serve
```

The app will automatically detect Ollama running on `localhost:11434`.

## 🎯 Provider Comparison

| Provider | Setup | Speed | Privacy | Quality | Cost |
|----------|-------|-------|---------|---------|------|
| **Groq** | ✅ None | ⚡ Fast | 🔒 Good | ⭐⭐⭐⭐ | 🆓 Free |
| **Hugging Face** | ✅ None | 🐌 Slow | 🔒 Good | ⭐⭐⭐ | 🆓 Free |
| **Ollama** | 🔧 Install | 📱 Device | 🔒 Perfect | ⭐⭐⭐⭐⭐ | 🆓 Free |

## 💡 Recommendations

- **Start with Groq**: Fastest setup, great quality
- **Use Hugging Face**: If Groq has issues
- **Use Ollama**: For maximum privacy and offline use

## 🛠️ Troubleshooting

### Groq Issues
- Sometimes has rate limits
- Switch to Hugging Face as backup

### Hugging Face Issues
- May be slower or have timeouts
- Try Ollama for reliability

### Ollama Issues
- Make sure `ollama serve` is running
- Check that a model is installed: `ollama list`
- Verify it's accessible: `curl http://localhost:11434/api/tags`

## 🎉 Benefits of Free AI

- **No costs**: Use as much as you want
- **No API keys**: No setup complexity
- **Privacy**: Your conversations stay private
- **Reliability**: Multiple backup providers
- **Offline option**: Ollama works without internet

## 🔄 Switching Providers

1. Open the app
2. Go to Settings tab
3. Tap "AI Settings"
4. Select your preferred provider
5. Start chatting!

The app remembers your choice and uses it for all AI conversations.

---

**🎊 Enjoy your completely free AI-powered journaling experience!**
