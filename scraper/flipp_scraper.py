"""
GroceryGenius Flipp Scraper

Adapted from https://github.com/Kiizon/flippscrape
Fetches weekly grocery deals from Flipp's internal API and syncs to Supabase.
"""

import os
import re
import json
import requests
from datetime import datetime, date
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Priority stores to filter for
PRIORITY_STORES = {
    'aldi': ['aldi'],
    'lidl': ['lidl'],
    'harris-teeter': ['harris teeter', 'harris-teeter'],
    'safeway': ['safeway'],
}

# Category mapping based on common keywords
CATEGORY_KEYWORDS = {
    'produce': ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'potato', 'onion',
                'carrot', 'celery', 'broccoli', 'spinach', 'avocado', 'grape', 'berry',
                'strawberry', 'blueberry', 'lemon', 'lime', 'pepper', 'cucumber', 'fruit',
                'vegetable', 'salad', 'mushroom', 'corn', 'melon', 'watermelon', 'pear'],
    'meat': ['beef', 'chicken', 'pork', 'turkey', 'steak', 'ground', 'sausage', 'bacon',
             'ham', 'roast', 'ribs', 'wing', 'thigh', 'breast', 'lamb', 'meat', 'hot dog',
             'frankfurter', 'brisket', 'tenderloin', 'drumstick'],
    'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'cottage', 'sour cream',
              'half & half', 'half and half', 'creamer', 'whipped'],
    'pantry': ['rice', 'pasta', 'beans', 'canned', 'soup', 'sauce', 'oil', 'flour',
               'sugar', 'cereal', 'oatmeal', 'bread', 'peanut butter', 'jelly', 'jam',
               'honey', 'syrup', 'spice', 'seasoning', 'condiment', 'ketchup', 'mustard',
               'mayo', 'mayonnaise', 'vinegar', 'dressing'],
    'frozen': ['frozen', 'ice cream', 'pizza', 'fries', 'vegetables', 'meal', 'dinner',
               'breakfast', 'waffle', 'popsicle'],
    'bakery': ['bread', 'bagel', 'muffin', 'donut', 'croissant', 'roll', 'bun', 'cake',
               'pie', 'cookie', 'pastry', 'tortilla'],
    'beverages': ['water', 'soda', 'juice', 'coffee', 'tea', 'drink', 'beverage', 'pop',
                  'cola', 'lemonade', 'energy', 'sparkling', 'beer', 'wine', 'alcohol'],
    'snacks': ['chip', 'cracker', 'pretzel', 'popcorn', 'nut', 'candy', 'chocolate',
               'snack', 'granola', 'bar', 'cookie'],
    'household': ['paper', 'towel', 'tissue', 'napkin', 'detergent', 'soap', 'cleaner',
                  'trash', 'bag', 'foil', 'wrap', 'storage', 'laundry', 'dish'],
}


class FlippScraper:
    """Scraper for Flipp grocery deals API."""

    BASE_URL = "https://backflipp.wishabi.com/flipp"

    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.session = requests.Session()
        self.store_ids: dict[str, str] = {}  # slug -> uuid mapping
        self._load_store_ids()

    def _load_store_ids(self):
        """Load store UUIDs from Supabase."""
        response = self.supabase.table('stores').select('id, slug').execute()
        for store in response.data:
            self.store_ids[store['slug']] = store['id']

    def _get_postal_code_data(self, zip_code: str) -> Optional[dict]:
        """Get location data for a US zip code."""
        url = f"{self.BASE_URL}/postal_codes/{zip_code}"
        params = {'locale': 'en-us'}

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error getting postal code data: {e}")
            return None

    def _get_flyers(self, zip_code: str) -> list[dict]:
        """Fetch available flyers for a zip code."""
        url = f"{self.BASE_URL}/flyers"
        params = {
            'locale': 'en-us',
            'postal_code': zip_code,
        }

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching flyers: {e}")
            return []

    def _get_flyer_items(self, flyer_id: int) -> list[dict]:
        """Fetch all items from a specific flyer."""
        url = f"{self.BASE_URL}/flyers/{flyer_id}/items"
        params = {'locale': 'en-us'}

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching flyer items: {e}")
            return []

    def _match_store(self, merchant_name: str) -> Optional[str]:
        """Match a merchant name to our priority stores."""
        merchant_lower = merchant_name.lower()

        for slug, keywords in PRIORITY_STORES.items():
            for keyword in keywords:
                if keyword in merchant_lower:
                    return slug

        return None

    def _categorize_item(self, item_name: str) -> str:
        """Categorize an item based on its name."""
        item_lower = item_name.lower()

        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in item_lower:
                    return category

        return 'other'

    def _parse_price(self, item: dict) -> tuple[Optional[str], Optional[float]]:
        """Parse price from Flipp item data."""
        price_text = item.get('price_text', '') or item.get('current_price', '')
        pre_price_text = item.get('pre_price_text', '')
        post_price_text = item.get('post_price_text', '')

        # Combine price parts
        full_price = f"{pre_price_text} {price_text} {post_price_text}".strip()
        if not full_price:
            full_price = None

        # Try to extract numeric price
        price_numeric = None
        if price_text:
            # Match patterns like "$2.99", "2.99", "2/$5"
            match = re.search(r'\$?([\d.]+)', str(price_text))
            if match:
                try:
                    price_numeric = float(match.group(1))
                except ValueError:
                    pass

        return full_price, price_numeric

    def get_deals(self, zip_code: str) -> list[dict]:
        """
        Fetch all deals for a zip code from our priority stores.

        Returns a list of deal dictionaries ready for Supabase insertion.
        """
        deals = []
        flyers = self._get_flyers(zip_code)

        print(f"Found {len(flyers)} flyers for zip code {zip_code}")

        for flyer in flyers:
            merchant = flyer.get('merchant', '')
            store_slug = self._match_store(merchant)

            if not store_slug:
                continue  # Skip non-priority stores

            if store_slug not in self.store_ids:
                print(f"Warning: Store {store_slug} not found in database")
                continue

            flyer_id = flyer.get('id')
            valid_from = flyer.get('valid_from', '').split('T')[0] if flyer.get('valid_from') else None
            valid_to = flyer.get('valid_to', '').split('T')[0] if flyer.get('valid_to') else None

            print(f"Fetching items from {merchant} (flyer {flyer_id})...")
            items = self._get_flyer_items(flyer_id)

            for item in items:
                item_name = item.get('name', '').strip()
                if not item_name:
                    continue

                price_text, price_numeric = self._parse_price(item)
                category = self._categorize_item(item_name)

                deal = {
                    'store_id': self.store_ids[store_slug],
                    'item_name': item_name,
                    'price': price_text,
                    'price_numeric': price_numeric,
                    'unit_price': item.get('unit_price'),
                    'category': category,
                    'valid_from': valid_from,
                    'valid_to': valid_to,
                    'source_flyer_id': str(flyer_id),
                    'raw_data': {
                        'flyer_id': flyer_id,
                        'item_id': item.get('id'),
                        'merchant': merchant,
                        'description': item.get('description'),
                        'image_url': item.get('cutout_image_url') or item.get('image_url'),
                    }
                }
                deals.append(deal)

            print(f"  Found {len(items)} items")

        return deals

    def sync_deals(self, zip_code: str) -> int:
        """
        Sync deals from Flipp to Supabase.

        1. Fetches current deals from Flipp
        2. Deletes expired deals from database
        3. Upserts new deals

        Returns the number of deals synced.
        """
        # Fetch fresh deals
        deals = self.get_deals(zip_code)

        if not deals:
            print("No deals found to sync")
            return 0

        # Delete expired deals
        today = date.today().isoformat()
        self.supabase.table('deals').delete().lt('valid_to', today).execute()
        print(f"Cleaned up expired deals")

        # Insert new deals in batches
        batch_size = 100
        for i in range(0, len(deals), batch_size):
            batch = deals[i:i + batch_size]
            self.supabase.table('deals').upsert(
                batch,
                on_conflict='store_id,item_name,valid_from'
            ).execute()

        print(f"Synced {len(deals)} deals to Supabase")
        return len(deals)


def main():
    """Main entry point for the scraper."""
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
        return

    # Default zip code - Washington DC area for good coverage of priority stores
    zip_code = os.getenv('SCRAPER_ZIP_CODE', '20001')

    print(f"Starting GroceryGenius scraper for zip code {zip_code}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("-" * 50)

    scraper = FlippScraper(supabase_url, supabase_key)
    count = scraper.sync_deals(zip_code)

    print("-" * 50)
    print(f"Scraper complete. {count} deals synced.")


if __name__ == "__main__":
    main()
