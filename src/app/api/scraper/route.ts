import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Priority stores to scrape
const PRIORITY_STORES: Record<string, string[]> = {
  'aldi': ['aldi'],
  'lidl': ['lidl'],
  'harris-teeter': ['harris teeter', 'harris-teeter'],
  'safeway': ['safeway'],
  'walmart': ['walmart'],
}

// Category mapping based on keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
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

function matchStore(merchantName: string): string | null {
  const merchantLower = merchantName.toLowerCase()
  for (const [slug, keywords] of Object.entries(PRIORITY_STORES)) {
    for (const keyword of keywords) {
      if (merchantLower.includes(keyword)) {
        return slug
      }
    }
  }
  return null
}

function categorizeItem(itemName: string): string {
  const itemLower = itemName.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (itemLower.includes(keyword)) {
        return category
      }
    }
  }
  return 'other'
}

function parsePrice(item: Record<string, unknown>): { priceText: string | null; priceNumeric: number | null } {
  const priceTextRaw = (item.price_text as string) || (item.current_price as string) || ''
  const prePriceText = (item.pre_price_text as string) || ''
  const postPriceText = (item.post_price_text as string) || ''

  const fullPrice = `${prePriceText} ${priceTextRaw} ${postPriceText}`.trim() || null

  let priceNumeric: number | null = null
  if (priceTextRaw) {
    const match = String(priceTextRaw).match(/\$?([\d.]+)/)
    if (match) {
      priceNumeric = parseFloat(match[1]) || null
    }
  }

  return { priceText: fullPrice, priceNumeric }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow cron jobs or requests with service role key
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`

  if (!isAuthorized && cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const zipCode = request.nextUrl.searchParams.get('zip') || process.env.SCRAPER_ZIP_CODE || '20001'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get store IDs from database
    const { data: stores, error: storesError } = await supabase.from('gg_stores').select('id, slug')

    if (storesError) {
      return NextResponse.json({ error: 'Failed to fetch stores', details: storesError.message }, { status: 500 })
    }

    const storeIds: Record<string, string> = {}
    for (const store of stores || []) {
      storeIds[store.slug] = store.id
    }

    if (Object.keys(storeIds).length === 0) {
      return NextResponse.json({ error: 'No stores found in database' }, { status: 500 })
    }

    // Fetch flyers from Flipp
    const flyersResponse = await fetch(
      `https://backflipp.wishabi.com/flipp/flyers?locale=en-us&postal_code=${zipCode}`
    )

    if (!flyersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch flyers from Flipp', status: flyersResponse.status }, { status: 500 })
    }

    const flyers = await flyersResponse.json()

    console.log(`Found ${flyers.length} flyers for zip code ${zipCode}`)

    const deals: Record<string, unknown>[] = []

    for (const flyer of flyers) {
      const merchant = flyer.merchant || ''
      const storeSlug = matchStore(merchant)

      if (!storeSlug || !storeIds[storeSlug]) {
        continue
      }

      const flyerId = flyer.id
      const validFrom = flyer.valid_from?.split('T')[0] || null
      const validTo = flyer.valid_to?.split('T')[0] || null

      console.log(`Fetching items from ${merchant} (flyer ${flyerId})...`)

      let items = []
      try {
        const itemsResponse = await fetch(
          `https://backflipp.wishabi.com/flipp/flyers/${flyerId}/items?locale=en-us`
        )
        if (itemsResponse.ok) {
          items = await itemsResponse.json()
        }
      } catch (e) {
        console.error(`Failed to fetch items for flyer ${flyerId}:`, e)
        continue
      }

      for (const item of items) {
        const itemName = (item.name || '').trim()
        if (!itemName) continue

        const { priceText, priceNumeric } = parsePrice(item)
        const category = categorizeItem(itemName)

        deals.push({
          store_id: storeIds[storeSlug],
          item_name: itemName,
          price: priceText,
          price_numeric: priceNumeric,
          unit_price: item.unit_price || null,
          category,
          valid_from: validFrom,
          valid_to: validTo,
          source_flyer_id: String(flyerId),
          raw_data: {
            flyer_id: flyerId,
            item_id: item.id,
            merchant,
            description: item.description,
            image_url: item.cutout_image_url || item.image_url,
          },
        })
      }

      console.log(`  Found ${items.length} items`)
    }

    if (deals.length === 0) {
      return NextResponse.json({ message: 'No deals found', count: 0 })
    }

    // Get unique store IDs from the deals we're about to insert
    const storeIdsToUpdate = [...new Set(deals.map(d => d.store_id))] as string[]

    // Delete existing deals for these stores
    const { error: deleteError } = await supabase.from('gg_deals').delete().in('store_id', storeIdsToUpdate)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete old deals', details: deleteError.message }, { status: 500 })
    }

    // Insert deals in batches
    const batchSize = 100
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize)
      const { error } = await supabase.from('gg_deals').insert(batch)
      if (error) {
        console.error('Insert error:', error)
        throw error
      }
    }

    return NextResponse.json({
      message: `Synced ${deals.length} deals for zip code ${zipCode}`,
      count: deals.length
    })
  } catch (error) {
    console.error('Scraper error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape deals', details: String(error) },
      { status: 500 }
    )
  }
}
