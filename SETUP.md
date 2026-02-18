# 🛠️ Setup Guide

Complete installation and configuration guide for the Academic Registration System.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **Package Manager**: npm (recommended) or pnpm
- **Database**: Supabase account
- **Browser**: Modern browser with WebAuthn support (Chrome 67+, Firefox 60+, Safari 14+)
- **Git**: For version control

### Recommended Development Environment
- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space for project and dependencies

## 🚀 Quick Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd academic-registration-system
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local  # or use your preferred editor
```

### 4. Database Setup
Execute SQL scripts in Supabase SQL Editor in this order:
```sql
-- 1. Core tables
/scripts/001_create_tables.sql

-- 2. Student profiles and quizzes
/scripts/002_student_profile_and_quizzes.sql

-- 3. Security features
/scripts/003_security_features.sql

-- 4. Constraints
/scripts/004_add_unique_profiles_constraints.sql

-- 5. Additional columns
/scripts/005_add_missing_student_form_columns.sql

-- 6. Push notifications
/scripts/006_push_subscriptions.sql

-- 7. User sync
/scripts/007_sync_auth_users_to_profiles.sql

-- 8. Admin CRUD
/scripts/008_add_admin_profiles_crud.sql

-- 9. Ecuador fields
/scripts/009_ecuador_onboarding_fields.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## ⚙️ Detailed Configuration

### Environment Variables

Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string

# PWA Configuration
NEXT_PUBLIC_PWA_ENABLED=true

# Development
NODE_ENV=development
```

### Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down project URL and API keys

2. **Database Configuration**
   - Enable Row Level Security (RLS)
   - Configure authentication settings
   - Set up storage buckets if needed

3. **Authentication Providers**
   - Configure Google OAuth (see [SETUP_GOOGLE_OAUTH.md](SETUP_GOOGLE_OAUTH.md))
   - Enable email confirmation
   - Configure password policies

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback/google` (development)
   - `https://yourdomain.com/auth/callback/google` (production)
6. Add credentials to `.env.local`

## 🏗️ Project Structure Setup

After installation, your project should look like this:

```
academic-registration-system/
├── .env.local                 # Environment variables
├── .next/                     # Next.js build files
├── node_modules/              # Dependencies
├── public/                    # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons
├── app/                       # Next.js app directory
├── components/                # React components
├── hooks/                     # Custom hooks
├── lib/                       # Utilities
├── scripts/                   # Database scripts
└── README.md                  # This file
```

## 🔧 Development Setup

### Code Editor Configuration

**VS Code Recommended Extensions:**
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# End-to-end testing
npm run test:e2e
```

## 🗄️ Database Migration

### Manual Migration
Execute scripts in Supabase SQL Editor in numerical order.

### Automated Migration (Future)
```bash
# Planned for future releases
npm run db:migrate
```

### Data Seeding (Optional)
```sql
-- Insert sample data (optional)
-- See scripts/ directory for examples
```

## 🔒 Security Configuration

### PIN Security
- 6-digit PIN with SHA-256 hashing
- Anti-brute force protection (5 attempts/15 minutes)
- Automatic account locking

### Biometric Authentication
- WebAuthn/FIDO2 standard
- Hardware-backed security
- Cross-device compatibility

### Row Level Security (RLS)
- Automatic policy application
- User-based data isolation
- Admin override capabilities

## 📱 PWA Setup

### Service Worker
- Automatic registration on app load
- Background sync for offline functionality
- Push notification handling

### Web App Manifest
- Configured for installable PWA
- Custom icons and splash screens
- Theme color configuration

### Offline Functionality
- Core features work without internet
- Automatic data synchronization
- Cache management

## 🧪 Testing Setup

### Unit Tests
```bash
# Run unit tests (when implemented)
npm run test:unit
```

### Integration Tests
```bash
# Run integration tests (when implemented)
npm run test:integration
```

### End-to-End Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui
```

### Manual Testing Checklist
See [`VERIFICACION_Y_TESTING.md`](VERIFICACION_Y_TESTING.md) for comprehensive testing procedures.

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXTAUTH_URL=https://yourdomain.com
```

### Build Optimization
```bash
# Create optimized production build
npm run build

# Analyze bundle size
npm install --save-dev @next/bundle-analyzer
npm run build:analyze
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

#### Hostinger VPS
See [`DEPLOY_SERVIDOR_GUIA.md`](DEPLOY_SERVIDOR_GUIA.md) for detailed VPS setup.

#### Other Platforms
- Netlify
- Railway
- Render
- Self-hosted with Docker

## 🔍 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Database Connection Issues**
- Verify Supabase credentials
- Check RLS policies
- Ensure all migrations are applied

**PWA Not Working**
- Check service worker registration
- Verify HTTPS in production
- Clear browser cache

**Authentication Problems**
- Verify OAuth configuration
- Check redirect URIs
- Ensure cookies are enabled

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

### Performance Issues
- Check bundle size with `npm run build:analyze`
- Optimize images and assets
- Implement code splitting

## 📞 Support

### Getting Help
1. Check this setup guide
2. Review existing documentation
3. Search GitHub issues
4. Create detailed bug report

### Community
- GitHub Discussions for questions
- Discord server (planned)
- Documentation wiki

## 📋 Checklist

### Pre-Installation
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Code editor configured

### Installation
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database scripts executed

### Configuration
- [ ] Supabase project set up
- [ ] Google OAuth configured (optional)
- [ ] PWA settings verified
- [ ] Security policies applied

### Testing
- [ ] Development server starts
- [ ] Basic functionality works
- [ ] Authentication flows tested
- [ ] PWA features verified

### Deployment
- [ ] Production build successful
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate installed

## 🎯 Next Steps

After setup completion:
1. Read [`00_COMIENZA_AQUI.md`](00_COMIENZA_AQUI.md) for overview
2. Follow [`QUICK_START.md`](QUICK_START.md) for first use
3. Configure security in `/dashboard/security`
4. Set up user roles and permissions
5. Import or create initial data

---

**Need help?** Check the documentation index at [`README_DOCUMENTACION.md`](README_DOCUMENTACION.md)
