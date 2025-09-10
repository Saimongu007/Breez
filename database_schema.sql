-- =====================================================
-- BREEZ+ ACADEMIC RESOURCE SHARING PLATFORM
-- Database Schema for Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
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

-- =====================================================
-- 2. CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#2563EB',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Mathematics', 'Mathematical concepts, formulas, and problem solving', 'calculator'),
('Physics', 'Physics principles, experiments, and theories', 'atom'),
('Chemistry', 'Chemical reactions, lab reports, and molecular studies', 'flask'),
('Biology', 'Life sciences, anatomy, and biological processes', 'dna'),
('Computer Science', 'Programming, algorithms, and software development', 'code'),
('Engineering', 'Engineering principles, designs, and technical solutions', 'cog'),
('Literature', 'Literary analysis, essays, and creative writing', 'book'),
('History', 'Historical events, analysis, and research', 'scroll'),
('Economics', 'Economic theories, market analysis, and financial studies', 'trending-up'),
('Psychology', 'Psychological theories, research, and case studies', 'brain');

-- =====================================================
-- 3. RESOURCES TABLE
-- =====================================================
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

-- =====================================================
-- 4. DOWNLOADS TABLE (Transaction History)
-- =====================================================
CREATE TABLE downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    downloader_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    coins_spent INTEGER NOT NULL CHECK (coins_spent >= 0),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate downloads by same user
    UNIQUE(resource_id, downloader_id)
);

-- =====================================================
-- 5. COIN TRANSACTIONS TABLE
-- =====================================================
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

-- =====================================================
-- 6. USER SETTINGS TABLE
-- =====================================================
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

-- =====================================================
-- 7. ACHIEVEMENTS TABLE
-- =====================================================
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

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Upload', 'Upload your first resource', 'upload', 'uploads', 1),
('Top Contributor', 'Upload 10 resources', 'trophy', 'uploads', 10),
('Rising Star', 'Earn 50 coins', 'trending-up', 'coins_earned', 50),
('Quality Creator', 'Upload 5 high-quality resources', 'award', 'uploads', 5),
('Super Sharer', 'Upload 25 resources', 'medal', 'uploads', 25),
('Coin Collector', 'Earn 100 coins', 'coins', 'coins_earned', 100),
('Knowledge Seeker', 'Download 20 resources', 'book-open', 'downloads', 20),
('Academic Explorer', 'Download 50 resources', 'compass', 'downloads', 50);

-- =====================================================
-- 8. USER ACHIEVEMENTS TABLE (Junction Table)
-- =====================================================
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate achievements
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 9. REVIEWS/RATINGS TABLE (Optional for future)
-- =====================================================
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reviews ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (profile_visible = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Resources Policies
CREATE POLICY "Anyone can view approved resources" ON resources
    FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Users can insert own resources" ON resources
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Users can update own resources" ON resources
    FOR UPDATE USING (auth.uid() = uploader_id);

-- Downloads Policies
CREATE POLICY "Users can view own downloads" ON downloads
    FOR SELECT USING (auth.uid() = downloader_id);

CREATE POLICY "Users can insert own downloads" ON downloads
    FOR INSERT WITH CHECK (auth.uid() = downloader_id);

-- Coin Transactions Policies
CREATE POLICY "Users can view own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON coin_transactions
    FOR INSERT WITH CHECK (true); -- Will be handled by functions

-- User Settings Policies
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Resource Reviews Policies
CREATE POLICY "Anyone can view reviews" ON resource_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON resource_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON resource_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle resource upload (award coins)
CREATE OR REPLACE FUNCTION handle_resource_upload()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for resource upload
CREATE TRIGGER on_resource_upload
    AFTER INSERT ON resources
    FOR EACH ROW EXECUTE FUNCTION handle_resource_upload();

-- Function to handle resource download (spend coins)
CREATE OR REPLACE FUNCTION handle_resource_download()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for resource download
CREATE TRIGGER on_resource_download
    AFTER INSERT ON downloads
    FOR EACH ROW EXECUTE FUNCTION handle_resource_download();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USEFUL VIEWS FOR LEADERBOARD AND STATISTICS
-- =====================================================

-- Leaderboard View
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

-- Popular Resources View
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

-- User Statistics View
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

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

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Note: This will be populated when users sign up through the app
-- The triggers will automatically create profiles and handle transactions

-- =====================================================
-- END OF SCHEMA
-- =====================================================