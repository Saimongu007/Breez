# Breez+ Academic Resource Sharing Platform

<div align="center">

![Breez+ Logo](https://via.placeholder.com/200x80/2563EB/FFFFFF?text=Breez%2B)

**A comprehensive academic resource sharing platform for East Delta University students**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.1-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.0-black.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-green.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API](#api-documentation) • [Database](#database-schema) • [Contributing](#contributing)

</div>

## Overview

Breez+ is a modern, feature-rich academic resource sharing platform designed specifically for East Delta University students. The platform enables students to upload, share, and download academic materials while earning and spending coins in a gamified environment.

### 🎯 Key Highlights

- **📚 Resource Sharing**: Upload and download PDFs, documents, presentations, and images
- **🪙 Coin Economy**: Earn coins by uploading, spend coins to download resources
- **🏆 Gamification**: Achievement system with badges and leaderboards
- **🔐 Secure**: University email verification and comprehensive security policies
- **📱 Cross-Platform**: Works on iOS, Android, and Web
- **⚡ Real-time**: Live updates for leaderboards and user statistics

## Features

### 🔐 Authentication & User Management
- **University Email Verification**: Only `@eastdelta.edu.bd` emails allowed
- **Comprehensive Profiles**: Student ID, semester, and academic information
- **Privacy Controls**: Customizable profile visibility and statistics sharing
- **Settings Management**: Notifications, preferences, and privacy settings

### 📁 File Management
- **Multi-format Support**: PDF, DOC, DOCX, PPT, PPTX, Images, TXT
- **Smart Categorization**: 10+ academic categories (Math, Physics, CS, etc.)
- **Advanced Search**: Text search with category and file type filters
- **File Validation**: Automatic file type detection and size limits
- **Cloud Storage**: Secure file storage with Supabase Storage

### 🪙 Coin Economy System
- **Earn Coins**: Get 10 coins for each approved upload
- **Dynamic Pricing**: File prices based on type and size (2-7 coins)
- **Transaction History**: Complete audit trail of all coin activities
- **Balance Tracking**: Real-time coin balance updates
- **Fraud Prevention**: Duplicate download protection

### 🏆 Gamification & Social Features
- **Achievement System**: 8+ achievements for various milestones
- **Leaderboards**: Real-time rankings by coins and contributions
- **User Statistics**: Comprehensive stats dashboard
- **Progress Tracking**: Visual progress indicators
- **Community Recognition**: Top contributor highlights

### 📊 Analytics & Insights
- **Personal Dashboard**: Upload/download history and statistics
- **Performance Metrics**: Coin earnings, spending patterns
- **Popular Resources**: Trending and most downloaded content
- **User Engagement**: Activity tracking and insights

## Technology Stack

### Frontend
- **React Native 0.79.1**: Cross-platform mobile development
- **Expo 53.0.0**: Development platform and build tools
- **Expo Router**: File-based navigation system
- **TypeScript**: Type-safe development
- **Lucide React Native**: Modern icon library

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Robust relational database
- **Row Level Security**: Comprehensive data protection
- **Real-time Subscriptions**: Live data updates
- **Edge Functions**: Serverless function execution

### Storage & Security
- **Supabase Storage**: Secure file storage with CDN
- **JWT Authentication**: Secure user sessions
- **Email Verification**: University domain validation
- **Data Encryption**: End-to-end security

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- Git for version control
- Supabase account (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/breez-plus.git
cd breez-plus
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your Supabase credentials in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema from `database_schema.sql` in the SQL Editor
3. Configure authentication settings in Supabase dashboard
4. Set up storage bucket named `resources`

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

### 6. Run on Device/Simulator

- **iOS**: Press `i` in terminal or scan QR code with Expo Go
- **Android**: Press `a` in terminal or scan QR code with Expo Go
- **Web**: Press `w` in terminal or visit `http://localhost:19006`

## Usage

### For Students

#### 1. **Sign Up & Profile Setup**
```
1. Download Expo Go app
2. Scan QR code or visit web app
3. Sign up with your @eastdelta.edu.bd email
4. Complete profile with student ID and semester
5. Verify email and start using the platform
```

#### 2. **Uploading Resources**
```
1. Navigate to Upload tab
2. Fill in title and description
3. Select appropriate category
4. Choose file type (PDF, DOC, Image)
5. Select file from device
6. Submit for approval
7. Earn 10 coins upon approval
```

#### 3. **Downloading Resources**
```
1. Browse resources in Download tab
2. Use search and filters to find content
3. Check coin price and your balance
4. Confirm download to spend coins
5. Access downloaded files
```

#### 4. **Tracking Progress**
```
1. View Dashboard for personal statistics
2. Check Leaderboard for rankings
3. Monitor coin balance and transactions
4. Track achievements and progress
```

### For Administrators

#### Database Management
```sql
-- Approve pending resources
UPDATE resources SET is_approved = true WHERE id = 'resource_id';

-- Award bonus coins
INSERT INTO coin_transactions (user_id, transaction_type, amount, description, reference_type)
VALUES ('user_id', 'bonus', 50, 'Bonus for quality content', 'bonus');

-- View platform statistics
SELECT * FROM user_statistics;
SELECT * FROM popular_resources;
```

## Project Structure

```
breez-plus/
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab-based screens
│   │   ├── upload.tsx           # File upload interface
│   │   ├── download.tsx         # Resource browsing
│   │   ├── dashboard.tsx        # User dashboard
│   │   ├── leaderboard.tsx      # Rankings and achievements
│   │   └── settings.tsx         # User preferences
│   ├── auth.tsx                 # Demo mode screen
│   ├── login.tsx                # Login interface
│   ├── signup.tsx               # Registration form
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── AuthProvider.tsx         # Authentication context
│   └── AuthTester.tsx           # Auth testing component
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication logic
│   ├── useFileUpload.ts         # File upload handling
│   ├── useFrameworkReady.ts     # Framework initialization
│   └── useSettings.ts           # Settings management
├── lib/                          # Core libraries
│   ├── supabase.ts              # Supabase client setup
│   └── database.ts              # Database functions
├── utils/                        # Utility functions
│   └── validation.ts            # Form validation
├── docs/                         # Documentation
│   ├── SUPABASE_SETUP.md        # Backend setup guide
│   ├── BACKEND_SETUP.md         # Database configuration
│   └── DATABASE_VERIFICATION.md  # Schema verification
├── database_schema.sql           # Complete database schema
├── API.md                        # API documentation
├── DATABASE.md                   # Database documentation
└── README.md                     # This file
```

## API Documentation

The platform provides a comprehensive API for all operations. Key endpoints include:

### Authentication
- `signUp(email, password, metadata)` - User registration
- `signIn(email, password)` - User login
- `signOut()` - User logout

### Resources
- `getResources(filters)` - List resources with filtering
- `uploadResource(data)` - Upload new resource
- `downloadResource(resourceId, userId, coins)` - Download resource

### User Management
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(userId, updates)` - Update profile
- `getUserSettings(userId)` - Get user settings

### Gamification
- `getLeaderboard(limit)` - Get user rankings
- `getUserAchievements(userId)` - Get user achievements
- `getCoinTransactions(userId)` - Get transaction history

For complete API documentation, see [API.md](./API.md).

## Database Schema

The platform uses a robust PostgreSQL database with 9 main tables:

- **user_profiles**: User information and statistics
- **resources**: Uploaded academic materials
- **downloads**: Download transaction history
- **coin_transactions**: Complete coin economy audit trail
- **achievements**: Gamification system
- **categories**: Resource categorization
- **user_settings**: User preferences
- **user_achievements**: Achievement tracking
- **resource_reviews**: Rating and review system

For detailed database documentation, see [DATABASE.md](./DATABASE.md).

## Configuration

### Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### App Configuration

```json
// app.json
{
  "expo": {
    "name": "Breez+",
    "slug": "Breez+",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "plugins": ["expo-router", "expo-font", "expo-web-browser"]
  }
}
```

### Supabase Configuration

1. **Authentication Settings**:
   - Enable email/password authentication
   - Configure site URL and redirect URLs
   - Set up email templates

2. **Database Setup**:
   - Run `database_schema.sql` in SQL Editor
   - Enable Row Level Security on all tables
   - Configure storage bucket policies

3. **Storage Configuration**:
   - Create `resources` bucket
   - Set up access policies
   - Configure file size limits

## Development

### Running Tests

```bash
# Run type checking
npm run lint

# Run Expo development build
npm run dev

# Build for production
npm run build:web
```

### Code Style

The project follows these conventions:
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Expo rules
- **Prettier**: Code formatting (configured in `.prettierrc`)
- **File Naming**: kebab-case for files, PascalCase for components

### Adding New Features

1. **Database Changes**: Update `database_schema.sql`
2. **API Functions**: Add to `lib/database.ts`
3. **UI Components**: Create in appropriate screen files
4. **Type Definitions**: Update interfaces in relevant files
5. **Documentation**: Update API.md and DATABASE.md

### Backend Deployment

The Supabase backend is automatically deployed and managed. For custom deployments:

1. Set up PostgreSQL database
2. Run migration scripts
3. Configure authentication provider
4. Set up file storage service
5. Deploy edge functions if needed

## Security

### Data Protection
- **Row Level Security**: All database tables protected
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size validation
- **Authentication**: JWT-based secure sessions

### Privacy Features
- **Profile Visibility**: User-controlled privacy settings
- **Data Anonymization**: Optional statistics sharing
- **Secure File Access**: Authenticated file downloads
- **Audit Trail**: Complete transaction logging


## Performance

### Optimization Features
- **Database Indexing**: Strategic indexes for fast queries
- **Lazy Loading**: On-demand data loading
- **Caching**: Client-side data caching
- **Image Optimization**: Automatic image compression
- **Bundle Splitting**: Optimized app bundles

### Monitoring
- **Real-time Analytics**: User engagement tracking
- **Performance Metrics**: App performance monitoring
- **Error Tracking**: Comprehensive error logging
- **Usage Statistics**: Platform usage insights

## Contributing

We welcome contributions from the East Delta University community!

### Getting Started

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/breez-plus.git
cd breez-plus
git checkout -b feature/your-feature-name
```

2. **Set Up Development Environment**
```bash
npm install
cp .env.example .env
# Configure your Supabase credentials
npm run dev
```

3. **Make Your Changes**
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Test thoroughly on multiple platforms

4. **Submit Pull Request**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Contribution Guidelines

- **Code Quality**: Follow TypeScript and React Native best practices
- **Testing**: Test on iOS, Android, and Web platforms
- **Documentation**: Update relevant documentation files
- **Security**: Follow security best practices
- **Performance**: Ensure changes don't impact performance

### Areas for Contribution

- **UI/UX Improvements**: Enhanced user interface design
- **New Features**: Additional functionality and capabilities
- **Performance Optimization**: Speed and efficiency improvements
- **Bug Fixes**: Issue resolution and stability improvements
- **Documentation**: Improved guides and tutorials
- **Testing**: Automated testing and quality assurance

## Support

### Getting Help

- **Documentation**: Check API.md and DATABASE.md
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### Common Issues

1. **Authentication Problems**
   - Verify Supabase credentials in `.env`
   - Check email domain restrictions
   - Ensure proper redirect URLs

2. **File Upload Issues**
   - Verify storage bucket configuration
   - Check file size and type limits
   - Ensure proper permissions

3. **Database Errors**
   - Verify schema is properly installed
   - Check RLS policies
   - Ensure user permissions

### Troubleshooting

```bash
# Clear Expo cache
expo start --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Check Supabase connection
# Verify environment variables and network connectivity
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **East Delta University**: For supporting student innovation
- **Supabase Team**: For providing excellent backend services
- **Expo Team**: For the amazing development platform
- **React Native Community**: For continuous improvements
- **Contributors**: All students and developers who contributed

---

<div align="center">

**Built with ❤️ for East Delta University Students**

[🌟 Star this repo](https://github.com/your-username/breez-plus) • [🐛 Report Bug](https://github.com/your-username/breez-plus/issues) • [💡 Request Feature](https://github.com/your-username/breez-plus/issues)

</div>