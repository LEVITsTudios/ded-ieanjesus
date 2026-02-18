# 🎓 Academic Registration System

A modern, secure, and comprehensive educational management platform built with Next.js, designed for Sunday Schools and educational institutions. Features Progressive Web App (PWA) capabilities, advanced security with multi-factor authentication, and complete student management.

## ✨ Features

### 🏫 Core Functionality
- **Student Management**: Complete profiles with personal data, location tracking, and document management
- **Course Administration**: Create and manage courses, materials, and assignments
- **Attendance Tracking**: Automated attendance recording with detailed reports
- **Grade Management**: Comprehensive grading system with analytics
- **Schedule Management**: Flexible scheduling for classes and events
- **Meeting Coordination**: Virtual meetings between teachers, students, and parents

### 🔐 Advanced Security
- **Multi-Layer Authentication**: Email/password, PIN (6-digit), biometric (WebAuthn), Google OAuth
- **Security Questions**: 10 predefined questions for account recovery
- **Anti-Brute Force**: Automatic blocking after failed attempts
- **Audit Logs**: Complete tracking of all security events
- **Row Level Security (RLS)**: Database-level access control

### 📱 Progressive Web App (PWA)
- **Offline Functionality**: Core features work without internet
- **Push Notifications**: Real-time alerts for important events
- **Installable**: Can be installed as a native app on mobile devices
- **Background Sync**: Automatic data synchronization when online

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Themes**: Automatic theme switching
- **Accessibility**: WCAG compliant components
- **Intuitive Navigation**: Clean, modern interface

## 🚀 Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: Service Workers, Web App Manifest
- **Security**: Web Crypto API, WebAuthn, SHA-256 hashing
- **Testing**: Playwright for E2E testing
- **Deployment**: Vercel, Hostinger VPS

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Modern web browser with WebAuthn support (recommended)

## 🛠️ Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd academic-registration-system
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Database Setup
Execute the SQL scripts in order:
```sql
-- Run in Supabase SQL Editor
/scripts/001_create_tables.sql
/scripts/002_student_profile_and_quizzes.sql
/scripts/003_security_features.sql
/scripts/004_add_unique_profiles_constraints.sql
/scripts/005_add_missing_student_form_columns.sql
/scripts/006_push_subscriptions.sql
/scripts/007_sync_auth_users_to_profiles.sql
/scripts/008_add_admin_profiles_crud.sql
/scripts/009_ecuador_onboarding_fields.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📖 Usage Guide

### For New Users
1. **Registration**: Create account at `/auth/register`
2. **Onboarding**: Complete profile setup at `/onboarding`
3. **Security Setup**: Configure PIN and security questions at `/dashboard/security`
4. **Dashboard**: Access main features through the dashboard

### For Administrators
- **User Management**: Add/edit students, teachers, and parents
- **Course Creation**: Set up courses and assign materials
- **Permissions**: Manage user roles and access levels
- **Reports**: Generate attendance and performance reports

### Key Pages
- `/dashboard` - Main dashboard with overview
- `/dashboard/students` - Student management
- `/dashboard/courses` - Course administration
- `/dashboard/attendance` - Attendance tracking
- `/dashboard/security` - Security settings
- `/onboarding` - User onboarding flow

## 🔧 Configuration

### Google OAuth Setup
Follow the detailed guide in [`SETUP_GOOGLE_OAUTH.md`](SETUP_GOOGLE_OAUTH.md)

### PWA Configuration
- Service worker: `public/sw.js`
- Web app manifest: `public/manifest.json`
- PWA setup guide: [`PWA_SETUP_GUIA.md`](PWA_SETUP_GUIA.md)

### Security Configuration
- PIN hashing: SHA-256 implementation
- Biometric auth: WebAuthn/FIDO2
- Security guide: [`SECURITY_SETUP_GUIDE.md`](SECURITY_SETUP_GUIDE.md)

## 🧪 Testing

### End-to-End Testing
```bash
npm run test:e2e
```

### Manual Testing Checklist
See [`VERIFICACION_Y_TESTING.md`](VERIFICACION_Y_TESTING.md) for comprehensive testing procedures.

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── onboarding/        # User onboarding flow
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Shadcn)
│   ├── dashboard/        # Dashboard-specific components
│   ├── security/         # Security-related components
│   └── pwa/              # PWA functionality
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── scripts/              # Database migration scripts
├── public/               # Static assets
└── e2e/                  # End-to-end tests
```

## 📚 Documentation

### Quick Start Guides
- [`00_COMIENZA_AQUI.md`](00_COMIENZA_AQUI.md) - **Start Here**
- [`QUICK_START.md`](QUICK_START.md) - 5-minute setup
- [`PWA_COMIENZA_AQUI.md`](PWA_COMIENZA_AQUI.md) - PWA quick start

### Detailed Guides
- [`README_PRINCIPAL.md`](README_PRINCIPAL.md) - Main overview
- [`SECURITY_SETUP_GUIDE.md`](SECURITY_SETUP_GUIDE.md) - Security setup
- [`GUIA_VISUAL.md`](GUIA_VISUAL.md) - Visual user guide
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Deployment instructions

### Technical Documentation
- [`INVENTARIO_CAMBIOS.md`](INVENTARIO_CAMBIOS.md) - Technical changes
- [`RESUMEN_IMPLEMENTACION.md`](RESUMEN_IMPLEMENTACION.md) - Implementation summary
- [`README_DOCUMENTACION.md`](README_DOCUMENTACION.md) - Documentation index

### Troubleshooting
- [`VERIFICACION_Y_TESTING.md`](VERIFICACION_Y_TESTING.md) - Testing & QA
- [`SOLUTION_PIN_MISMATCH.md`](SOLUTION_PIN_MISMATCH.md) - Common issues

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy via Vercel dashboard or CLI
```

### Hostinger VPS
See [`DEPLOY_SERVIDOR_GUIA.md`](DEPLOY_SERVIDOR_GUIA.md) for VPS deployment.

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Google OAuth set up
- [ ] SSL certificate installed
- [ ] PWA manifest configured
- [ ] Service worker tested

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure PWA compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **PWA not working**: Check service worker registration
- **Biometric auth failing**: Ensure HTTPS and WebAuthn support
- **Database errors**: Verify RLS policies and migrations
- **Build failures**: Check Node.js version and dependencies

### Getting Help
1. Check existing documentation
2. Search GitHub issues
3. Create a new issue with detailed information
4. Include browser console logs and error messages

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Academic Registration System** - Modern education management made simple.

For detailed setup instructions, see [`00_COMIENZA_AQUI.md`](00_COMIENZA_AQUI.md)
