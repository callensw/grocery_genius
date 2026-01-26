-- GroceryGenius Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table (seeded with our priority stores)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table (populated by scraper)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price TEXT,
  price_numeric DECIMAL(10,2),
  unit_price TEXT,
  category TEXT,
  valid_from DATE,
  valid_to DATE,
  source_flyer_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences (for logged in users)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User's selected stores
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- User's watch list
CREATE TABLE IF NOT EXISTS watch_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_keyword TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster deal searches
CREATE INDEX IF NOT EXISTS idx_deals_item_name ON deals USING gin(to_tsvector('english', item_name));
CREATE INDEX IF NOT EXISTS idx_deals_valid_dates ON deals(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_deals_store ON deals(store_id);
CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category);
CREATE INDEX IF NOT EXISTS idx_watch_list_user ON watch_list(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);

-- Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_list ENABLE ROW LEVEL SECURITY;

-- Stores and deals are public read
CREATE POLICY "Stores are viewable by everyone" ON stores
  FOR SELECT USING (true);

CREATE POLICY "Deals are viewable by everyone" ON deals
  FOR SELECT USING (true);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- User stores policies
CREATE POLICY "Users can view their own stores" ON user_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores" ON user_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" ON user_stores
  FOR DELETE USING (auth.uid() = user_id);

-- Watch list policies
CREATE POLICY "Users can view their own watch list" ON watch_list
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch list items" ON watch_list
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch list items" ON watch_list
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch list items" ON watch_list
  FOR DELETE USING (auth.uid() = user_id);

-- Seed priority stores
INSERT INTO stores (name, slug, logo_url, website) VALUES
  ('Aldi', 'aldi', '/stores/aldi.svg', 'https://www.aldi.us'),
  ('Lidl', 'lidl', '/stores/lidl.svg', 'https://www.lidl.com'),
  ('Harris Teeter', 'harris-teeter', '/stores/harris-teeter.svg', 'https://www.harristeeter.com'),
  ('Safeway', 'safeway', '/stores/safeway.svg', 'https://www.safeway.com')
ON CONFLICT (slug) DO NOTHING;
