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
  ('Aldi', 'aldi', 'https://www.aldi.us'),
  ('Lidl', 'lidl', 'https://www.lidl.com'),
  ('Harris Teeter', 'harris-teeter', 'https://www.harristeeter.com'),
  ('Safeway', 'safeway', 'https://www.safeway.com'),
  ('Walmart', 'walmart', 'https://www.walmart.com'),
  ('Kroger', 'kroger', 'https://www.kroger.com'),
  ('Publix', 'publix', 'https://www.publix.com'),
  ('Target', 'target', 'https://www.target.com'),
  ('Costco', 'costco', 'https://www.costco.com'),
  ('Sam''s Club', 'sams-club', 'https://www.samsclub.com'),
  ('Trader Joe''s', 'trader-joes', 'https://www.traderjoes.com'),
  ('Whole Foods', 'whole-foods', 'https://www.wholefoodsmarket.com'),
  ('Food Lion', 'food-lion', 'https://www.foodlion.com'),
  ('Giant', 'giant', 'https://giantfood.com'),
  ('Stop & Shop', 'stop-and-shop', 'https://stopandshop.com'),
  ('ShopRite', 'shoprite', 'https://www.shoprite.com'),
  ('Meijer', 'meijer', 'https://www.meijer.com'),
  ('H-E-B', 'heb', 'https://www.heb.com'),
  ('Wegmans', 'wegmans', 'https://www.wegmans.com'),
  ('Albertsons', 'albertsons', 'https://www.albertsons.com'),
  ('Vons', 'vons', 'https://www.vons.com'),
  ('Ralph''s', 'ralphs', 'https://www.ralphs.com'),
  ('Food 4 Less', 'food-4-less', 'https://www.food4less.com'),
  ('WinCo', 'winco', 'https://www.wincofoods.com'),
  ('Sprouts', 'sprouts', 'https://www.sprouts.com'),
  ('Fresh Market', 'fresh-market', 'https://www.thefreshmarket.com'),
  ('ACME', 'acme', 'https://www.acmemarkets.com'),
  ('Winn-Dixie', 'winn-dixie', 'https://www.winndixie.com'),
  ('Piggly Wiggly', 'piggly-wiggly', 'https://www.pigglywiggly.com'),
  ('Dollar General', 'dollar-general', 'https://www.dollargeneral.com'),
  ('CVS', 'cvs', 'https://www.cvs.com'),
  ('Walgreens', 'walgreens', 'https://www.walgreens.com'),
  ('Rite Aid', 'rite-aid', 'https://www.riteaid.com'),
  ('BI-LO', 'bi-lo', 'https://www.bi-lo.com'),
  ('Food City', 'food-city', 'https://www.foodcity.com'),
  ('Ingles', 'ingles', 'https://www.ingles-markets.com'),
  ('Harvey''s', 'harveys', 'https://www.harveys.com'),
  ('Fry''s', 'frys', 'https://www.frysfood.com'),
  ('Smith''s', 'smiths', 'https://www.smithsfoodanddrug.com'),
  ('King Soopers', 'king-soopers', 'https://www.kingsoopers.com'),
  ('City Market', 'city-market', 'https://www.citymarket.com'),
  ('Mariano''s', 'marianos', 'https://www.marianos.com'),
  ('Jewel-Osco', 'jewel-osco', 'https://www.jewelosco.com'),
  ('Tom Thumb', 'tom-thumb', 'https://www.tomthumb.com'),
  ('Randall''s', 'randalls', 'https://www.randalls.com')
ON CONFLICT (slug) DO NOTHING;
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
