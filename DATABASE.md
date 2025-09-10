# Breez+ Database Documentation

## Overview

The Breez+ platform uses a PostgreSQL database hosted on Supabase with a comprehensive schema designed to support academic resource sharing, user management, coin economy, achievements, and real-time features.

## Database Architecture

- **Database**: PostgreSQL 15+ (Supabase)
- **Extensions**: uuid-ossp for UUID generation
- **Security**: Row Level Security (RLS) enabled on all tables
- **Performance**: Optimized with strategic indexes
- **Real-time**: Supabase Realtime for live updates

## Core Tables

### 1. User Profiles (`user_profiles`)

Stores comprehensive user information and statistics.

```sql
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
    total_coins INTEGER DEFAULT 0 CHECK (total_coins >= 0),
    coins_earned INTEGER DEFAULT 0 CHECK (coins_earned >= 0),
    coins_spent INTEGER DEFAULT 0 CHECK (coins_spent >= 0),
    uploaded_files_count INTEGER DEFAULT 0 CHECK (uploaded_files_count >= 0),
    downloaded_files_count INTEGER DEFAULT 0 CHECK (downloaded_files_count >= 0),
    profile_visible BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    allow_messages BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Links to Supabase Auth users
- Tracks coin balance and transaction totals
- Maintains upload/download statistics
- Privacy controls for profile visibility
- Automatic timestamp management

**Indexes:**
```sql
CREATE INDEX idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_total_coins ON user_profiles(total_coins DESC);
```

### 2. Categories (`categories`)

Defines resource categories for organization.

```sql
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#2563EB',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Categories:**
- Mathematics
- Physics  
- Chemistry
- Biology
- Computer Science
- Engineering
- Literature
- History
- Economics
- Psychology

### 3. Resources (`resources`)

Central table for all uploaded academic resources.

```sql
CREATE TABLE resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'Image', 'TXT')),
    file_url TEXT,
    file_size INTEGER, -- in bytes
    coin_price INTEGER NOT NULL CHECK (coin_price >= 0),
    uploader_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[], -- Array of tags for better searchability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- Supports multiple file types
- Automatic coin pricing system
- Admin approval workflow
- Tag-based search capability
- Download tracking

**Indexes:**
```sql
CREATE INDEX idx_resources_category ON resources(category_id);
CREATE INDEX idx_resources_uploader ON resources(uploader_id);
CREATE INDEX idx_resources_approved ON resources(is_approved, is_active);
CREATE INDEX idx_resources_download_count ON resources(download_count DESC);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
```

### 4. Downloads (`downloads`)

Transaction history for resource downloads.

```sql
CREATE TABLE downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    downloader_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    coins_spent INTEGER NOT NULL CHECK (coins_spent >= 0),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate downloads by same user
    UNIQUE(resource_id, downloader_id)
);
```

**Key Features:**
- Prevents duplicate downloads
- Records coin transactions
- Maintains download history
- Links users to resources

### 5. Coin Transactions (`coin_transactions`)

Complete audit trail for all coin-related activities.

```sql
CREATE TABLE coin_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID, -- Can reference resource_id or download_id
    reference_type TEXT CHECK (reference_type IN ('upload', 'download', 'bonus', 'penalty')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Transaction Types:**
- `earned`: Coins gained from uploads
- `spent`: Coins used for downloads
- `bonus`: Administrative coin awards
- `penalty`: Administrative coin deductions

### 6. User Settings (`user_settings`)

Comprehensive user preference management.

```sql
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification Settings
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    download_notifications BOOLEAN DEFAULT true,
    upload_notifications BOOLEAN DEFAULT false,
    
    -- Privacy Settings
    profile_visible BOOLEAN DEFAULT true,
    show_stats BOOLEAN DEFAULT true,
    allow_messages BOOLEAN DEFAULT true,
    
    -- App Preferences
    dark_mode BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'English',
    auto_download BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Achievements (`achievements`)

Gamification system for user engagement.

```sql
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT DEFAULT '#F59E0B',
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('uploads', 'downloads', 'coins_earned', 'coins_spent')),
    requirement_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Achievements:**
- First Upload (1 upload)
- Top Contributor (10 uploads)
- Rising Star (50 coins earned)
- Quality Creator (5 uploads)
- Super Sharer (25 uploads)
- Coin Collector (100 coins earned)
- Knowledge Seeker (20 downloads)
- Academic Explorer (50 downloads)

### 8. User Achievements (`user_achievements`)

Junction table tracking user achievement progress.

```sql
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate achievements
    UNIQUE(user_id, achievement_id)
);
```

### 9. Resource Reviews (`resource_reviews`)

Rating and review system for resources.

```sql
CREATE TABLE resource_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_helpful BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One review per user per resource
    UNIQUE(resource_id, reviewer_id)
);
```

## Database Views

### Leaderboard View

Optimized view for ranking users by performance.

```sql
CREATE VIEW leaderboard AS
SELECT 
    up.id,
    up.full_name,
    up.student_id,
    up.semester,
    up.total_coins,
    up.uploaded_files_count,
    up.downloaded_files_count,
    up.coins_earned,
    RANK() OVER (ORDER BY up.total_coins DESC, up.coins_earned DESC) as rank
FROM user_profiles up
WHERE up.show_stats = true AND up.profile_visible = true
ORDER BY up.total_coins DESC, up.coins_earned DESC;
```

### Popular Resources View

Shows trending resources with uploader information.

```sql
CREATE VIEW popular_resources AS
SELECT 
    r.*,
    c.name as category_name,
    up.full_name as uploader_name,
    up.student_id as uploader_student_id
FROM resources r
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN user_profiles up ON r.uploader_id = up.id
WHERE r.is_approved = true AND r.is_active = true
ORDER BY r.download_count DESC, r.created_at DESC;
```

### User Statistics View

Comprehensive user statistics with achievement counts.

```sql
CREATE VIEW user_statistics AS
SELECT 
    up.id,
    up.full_name,
    up.student_id,
    up.total_coins,
    up.coins_earned,
    up.coins_spent,
    up.uploaded_files_count,
    up.downloaded_files_count,
    COUNT(ua.achievement_id) as achievements_count,
    up.created_at as join_date
FROM user_profiles up
LEFT JOIN user_achievements ua ON up.id = ua.user_id
GROUP BY up.id, up.full_name, up.student_id, up.total_coins, up.coins_earned, 
         up.coins_spent, up.uploaded_files_count, up.downloaded_files_count, up.created_at;
```

## Database Functions

### 1. User Profile Creation

Automatically creates user profile when a new user signs up.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, student_id, semester)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
        COALESCE((NEW.raw_user_meta_data->>'semester')::INTEGER, 1)
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Resource Upload Handler

Manages coin rewards and statistics when resources are uploaded.

```sql
CREATE OR REPLACE FUNCTION handle_resource_upload()
RETURNS TRIGGER AS $
BEGIN
    -- Award coins for upload (10 coins per upload)
    UPDATE user_profiles 
    SET 
        total_coins = total_coins + 10,
        coins_earned = coins_earned + 10,
        uploaded_files_count = uploaded_files_count + 1
    WHERE id = NEW.uploader_id;
    
    -- Record transaction
    INSERT INTO coin_transactions (user_id, transaction_type, amount, description, reference_id, reference_type)
    VALUES (NEW.uploader_id, 'earned', 10, 'Coins earned for uploading: ' || NEW.title, NEW.id, 'upload');
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_resource_upload
    AFTER INSERT ON resources
    FOR EACH ROW EXECUTE FUNCTION handle_resource_upload();
```

### 3. Resource Download Handler

Manages coin deduction and statistics when resources are downloaded.

```sql
CREATE OR REPLACE FUNCTION handle_resource_download()
RETURNS TRIGGER AS $
BEGIN
    -- Deduct coins from downloader
    UPDATE user_profiles 
    SET 
        total_coins = total_coins - NEW.coins_spent,
        coins_spent = coins_spent + NEW.coins_spent,
        downloaded_files_count = downloaded_files_count + 1
    WHERE id = NEW.downloader_id;
    
    -- Increment download count for resource
    UPDATE resources 
    SET download_count = download_count + 1
    WHERE id = NEW.resource_id;
    
    -- Record transaction
    INSERT INTO coin_transactions (user_id, transaction_type, amount, description, reference_id, reference_type)
    VALUES (NEW.downloader_id, 'spent', NEW.coins_spent, 'Coins spent on downloading resource', NEW.resource_id, 'download');
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_resource_download
    AFTER INSERT ON downloads
    FOR EACH ROW EXECUTE FUNCTION handle_resource_download();
```

### 4. Achievement Checker

Automatically awards achievements when users meet requirements.

```sql
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS VOID AS $
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
BEGIN
    -- Get user stats
    SELECT 
        uploaded_files_count,
        downloaded_files_count,
        coins_earned,
        coins_spent
    INTO user_stats
    FROM user_profiles
    WHERE id = user_uuid;
    
    -- Check each achievement
    FOR achievement_record IN 
        SELECT * FROM achievements WHERE is_active = true
    LOOP
        -- Check if user already has this achievement
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_uuid AND achievement_id = achievement_record.id
        ) THEN
            -- Check if user meets requirement
            CASE achievement_record.requirement_type
                WHEN 'uploads' THEN
                    IF user_stats.uploaded_files_count >= achievement_record.requirement_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id) 
                        VALUES (user_uuid, achievement_record.id);
                    END IF;
                WHEN 'downloads' THEN
                    IF user_stats.downloaded_files_count >= achievement_record.requirement_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id) 
                        VALUES (user_uuid, achievement_record.id);
                    END IF;
                WHEN 'coins_earned' THEN
                    IF user_stats.coins_earned >= achievement_record.requirement_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id) 
                        VALUES (user_uuid, achievement_record.id);
                    END IF;
                WHEN 'coins_spent' THEN
                    IF user_stats.coins_spent >= achievement_record.requirement_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id) 
                        VALUES (user_uuid, achievement_record.id);
                    END IF;
            END CASE;
        END IF;
    END LOOP;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Timestamp Update Function

Generic function to update `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

All tables have comprehensive RLS policies for data protection.

### User Profiles Policies

```sql
-- Users can view all profiles (respecting privacy settings)
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (profile_visible = true OR auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### Resources Policies

```sql
-- Anyone can view approved resources
CREATE POLICY "Anyone can view approved resources" ON resources
    FOR SELECT USING (is_approved = true AND is_active = true);

-- Users can insert own resources
CREATE POLICY "Users can insert own resources" ON resources
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Users can update own resources
CREATE POLICY "Users can update own resources" ON resources
    FOR UPDATE USING (auth.uid() = uploader_id);
```

### Downloads Policies

```sql
-- Users can view own downloads
CREATE POLICY "Users can view own downloads" ON downloads
    FOR SELECT USING (auth.uid() = downloader_id);

-- Users can insert own downloads
CREATE POLICY "Users can insert own downloads" ON downloads
    FOR INSERT WITH CHECK (auth.uid() = downloader_id);
```

### Coin Transactions Policies

```sql
-- Users can view own transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert transactions
CREATE POLICY "System can insert transactions" ON coin_transactions
    FOR INSERT WITH CHECK (true);
```

### User Settings Policies

```sql
-- Users can manage own settings
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);
```

### User Achievements Policies

```sql
-- Users can view own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);
```

### Resource Reviews Policies

```sql
-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON resource_reviews
    FOR SELECT USING (true);

-- Users can insert own reviews
CREATE POLICY "Users can insert own reviews" ON resource_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews" ON resource_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);
```

## Performance Optimization

### Strategic Indexes

```sql
-- User profiles indexes
CREATE INDEX idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_total_coins ON user_profiles(total_coins DESC);

-- Resources indexes
CREATE INDEX idx_resources_category ON resources(category_id);
CREATE INDEX idx_resources_uploader ON resources(uploader_id);
CREATE INDEX idx_resources_approved ON resources(is_approved, is_active);
CREATE INDEX idx_resources_download_count ON resources(download_count DESC);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);

-- Downloads indexes
CREATE INDEX idx_downloads_resource ON downloads(resource_id);
CREATE INDEX idx_downloads_user ON downloads(downloader_id);
CREATE INDEX idx_downloads_date ON downloads(downloaded_at DESC);

-- Coin transactions indexes
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX idx_coin_transactions_date ON coin_transactions(created_at DESC);

-- User achievements indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
```

### Query Optimization Tips

1. **Use Views**: Pre-computed views like `leaderboard` reduce query complexity
2. **Limit Results**: Always use `LIMIT` for large datasets
3. **Index Usage**: Queries are optimized to use existing indexes
4. **Batch Operations**: Use batch inserts for multiple records
5. **Connection Pooling**: Supabase handles connection pooling automatically

## Data Integrity

### Constraints

- **Foreign Keys**: Maintain referential integrity
- **Check Constraints**: Validate data ranges (coins >= 0, semester 1-12)
- **Unique Constraints**: Prevent duplicates (email, student_id, downloads)
- **Not Null**: Ensure required fields are populated

### Cascading Deletes

- User deletion cascades to profiles, settings, achievements
- Resource deletion cascades to downloads and reviews
- Category deletion sets resources.category_id to NULL

## Backup and Recovery

### Automated Backups (Supabase)

- **Daily backups** for 7 days (free tier)
- **Point-in-time recovery** available
- **Cross-region replication** for enterprise

### Manual Backup Commands

```sql
-- Export user data
COPY user_profiles TO '/tmp/user_profiles_backup.csv' DELIMITER ',' CSV HEADER;

-- Export resources
COPY resources TO '/tmp/resources_backup.csv' DELIMITER ',' CSV HEADER;

-- Export transactions
COPY coin_transactions TO '/tmp/transactions_backup.csv' DELIMITER ',' CSV HEADER;
```

## Monitoring and Analytics

### Key Metrics to Track

```sql
-- User engagement
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
    AVG(total_coins) as avg_coins,
    AVG(uploaded_files_count) as avg_uploads
FROM user_profiles;

-- Resource statistics
SELECT 
    c.name as category,
    COUNT(r.id) as resource_count,
    AVG(r.download_count) as avg_downloads,
    SUM(r.download_count) as total_downloads
FROM resources r
JOIN categories c ON r.category_id = c.id
WHERE r.is_approved = true
GROUP BY c.name;

-- Coin economy health
SELECT 
    SUM(CASE WHEN transaction_type = 'earned' THEN amount ELSE 0 END) as total_earned,
    SUM(CASE WHEN transaction_type = 'spent' THEN amount ELSE 0 END) as total_spent,
    COUNT(DISTINCT user_id) as active_users
FROM coin_transactions
WHERE created_at > NOW() - INTERVAL '30 days';
```

## Migration Scripts

### Adding New Features

```sql
-- Example: Adding file versioning
ALTER TABLE resources ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE resources ADD COLUMN parent_resource_id UUID REFERENCES resources(id);

-- Example: Adding user reputation
ALTER TABLE user_profiles ADD COLUMN reputation_score INTEGER DEFAULT 0;

-- Example: Adding resource categories
INSERT INTO categories (name, description, icon) VALUES
('Data Science', 'Data analysis and machine learning resources', 'bar-chart'),
('Web Development', 'Frontend and backend development materials', 'globe');
```

## Security Best Practices

1. **RLS Enabled**: All tables have Row Level Security
2. **Input Validation**: Check constraints prevent invalid data
3. **Audit Trail**: Complete transaction history in coin_transactions
4. **Privacy Controls**: User-controlled visibility settings
5. **Access Control**: Function-level security with SECURITY DEFINER
6. **Regular Updates**: Keep Supabase and extensions updated

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Trigger Not Firing**
   ```sql
   -- Check trigger status
   SELECT * FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

3. **Performance Issues**
   ```sql
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM leaderboard LIMIT 10;
   ```

4. **Constraint Violations**
   ```sql
   -- Check constraint details
   SELECT * FROM information_schema.check_constraints 
   WHERE constraint_schema = 'public';
   ```

## Future Enhancements

### Planned Features

1. **Advanced Search**: Full-text search with PostgreSQL's tsvector
2. **File Versioning**: Track resource updates and versions
3. **User Reputation**: Community-driven quality scoring
4. **Advanced Analytics**: Detailed usage statistics and reporting
5. **Notification System**: Real-time notifications for user activities
6. **Content Moderation**: AI-powered content filtering and approval

### Scalability Considerations

1. **Partitioning**: Partition large tables by date
2. **Read Replicas**: Use read replicas for analytics queries
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN Integration**: Use CDN for file storage and delivery
5. **Connection Pooling**: Optimize database connections

This database documentation provides a comprehensive overview of the Breez+ platform's data architecture, ensuring maintainability, scalability, and security for the academic resource sharing system.