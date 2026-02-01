# GroceryGenius

A web app that aggregates grocery deals from local stores, helping you find the best prices on groceries in your area.

## Features

- **Deal Aggregation** - Pulls weekly deals from major grocery stores via Flipp
- **Store Selection** - Choose which stores you shop at (Walmart, Aldi, Lidl, Harris Teeter, Safeway)
- **Category Filtering** - Browse by category: Produce, Meat, Dairy, Pantry, Frozen, Bakery, Beverages, Snacks, Household
- **Search** - Find specific items across all your selected stores
- **Watchlist** - Track items you're looking for and get notified when they go on sale
- **Direct Links** - Click through to view the full deal on Flipp

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Data Source**: Flipp API
- **Hosting**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

Create these tables in Supabase:

```sql
-- Stores table
CREATE TABLE gg_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals table
CREATE TABLE gg_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES gg_stores(id),
  item_name TEXT NOT NULL,
  price TEXT,
  price_numeric DECIMAL,
  unit_price TEXT,
  category TEXT,
  valid_from DATE,
  valid_to DATE,
  source_flyer_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable public read access
CREATE POLICY "Allow public read access" ON gg_stores FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON gg_deals FOR SELECT USING (true);

-- Seed stores
INSERT INTO gg_stores (name, slug, website) VALUES
  ('Walmart', 'walmart', 'https://www.walmart.com'),
  ('Aldi', 'aldi', 'https://www.aldi.us'),
  ('Lidl', 'lidl', 'https://www.lidl.com'),
  ('Harris Teeter', 'harris-teeter', 'https://www.harristeeter.com'),
  ('Safeway', 'safeway', 'https://www.safeway.com');
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Syncing Deals

Deals can be synced from the Settings page in the app, or by calling the API directly:

```
GET /api/scraper?zip=YOUR_ZIP_CODE
```

This fetches the latest weekly flyers from Flipp for stores in your area.

## License

MIT
