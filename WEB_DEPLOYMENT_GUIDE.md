# 🌐 TheraJournal Web Deployment Guide

This guide covers deploying TheraJournal as a web application instead of a mobile app.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Convert to web app"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your TheraJournal repository
   - Vercel will auto-detect it's a Vite project

3. **Set Environment Variables**
   - In Vercel dashboard, go to your project
   - Go to Settings → Environment Variables
   - Add:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Choose your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add your Supabase credentials

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://your-site.netlify.app`

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

4. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Your app will be live at `https://username.github.io/repository-name`

## 🔧 Manual Deployment

### Build the Project
```bash
npm install
npm run build
```

### Upload to Server
1. Upload the `dist` folder contents to your web server
2. Configure your web server to serve the `index.html` for all routes (SPA routing)
3. Set environment variables on your server

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist
    
    <Directory /path/to/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 🔐 Environment Variables

### Required Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables
```bash
NODE_ENV=production
```

## 📊 Performance Optimization

### Build Optimization
- Vite automatically optimizes the build
- Code splitting is enabled by default
- Assets are minified and compressed

### Runtime Optimization
- IndexedDB for large data storage
- Local search index for fast queries
- Service worker for offline functionality (can be added)

## 🔒 Security Considerations

### Web-Specific Security
- **HTTPS Required**: Always use HTTPS in production
- **CSP Headers**: Consider adding Content Security Policy headers
- **Session Storage**: Encryption keys stored in sessionStorage (cleared on browser close)
- **No Server-Side Rendering**: All encryption happens client-side

### Recommended Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.groq.com https://api-inference.huggingface.co;" always;
```

## 📱 Progressive Web App (PWA)

### Add PWA Support (Optional)
1. **Install PWA plugin**
   ```bash
   npm install vite-plugin-pwa -D
   ```

2. **Update vite.config.ts**
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa'
   
   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg}']
         }
       })
     ],
   })
   ```

3. **Add manifest.json**
   ```json
   {
     "name": "TheraJournal",
     "short_name": "TheraJournal",
     "description": "Privacy-first AI journaling",
     "theme_color": "#3b82f6",
     "background_color": "#ffffff",
     "display": "standalone",
     "start_url": "/",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Not Working**
   - Make sure variables start with `EXPO_PUBLIC_`
   - Restart your development server after adding variables
   - Check that variables are set in your deployment platform

3. **Routing Issues**
   - Make sure your server is configured for SPA routing
   - All routes should serve `index.html`

4. **Encryption Not Working**
   - Check that you're using HTTPS in production
   - Web Crypto API requires secure context

### Performance Issues

1. **Slow Loading**
   - Check bundle size: `npm run build` shows size analysis
   - Consider code splitting for large components
   - Optimize images and assets

2. **Search Performance**
   - IndexedDB operations are async, ensure proper error handling
   - Consider pagination for large datasets

## 📈 Monitoring

### Analytics (Optional)
```typescript
// Add to main.tsx
import { Analytics } from '@vercel/analytics/react'

// Add to App component
<Analytics />
```

### Error Tracking (Optional)
```typescript
// Add Sentry for error tracking
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
})
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Error tracking set up (optional)
- [ ] Analytics configured (optional)
- [ ] PWA manifest added (optional)
- [ ] Performance monitoring set up
- [ ] Backup strategy for user data
- [ ] Monitoring and alerting configured

## 💰 Cost Comparison

### Web vs Mobile Deployment

| Platform | Web | Mobile |
|----------|-----|--------|
| **Hosting** | Free (Vercel/Netlify) | $99/year (Apple) + $25 (Google) |
| **Development** | Instant updates | App store review process |
| **Distribution** | Direct link | App store approval |
| **Updates** | Automatic | Manual submission |
| **Analytics** | Built-in | Platform-specific |

### Monthly Costs (1,000 users)
- **Supabase**: $0 (free tier)
- **AI (Groq)**: $15-20
- **Hosting**: $0 (Vercel/Netlify free tier)
- **Total**: $15-25/month

---

**Your TheraJournal web app is ready to deploy! 🚀**
