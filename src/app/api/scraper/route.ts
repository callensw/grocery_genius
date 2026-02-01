import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Stores to scrape - match merchant names from Flipp
const PRIORITY_STORES: Record<string, string[]> = {
  'aldi': ['aldi'],
  'lidl': ['lidl'],
  'harris-teeter': ['harris teeter', 'harris-teeter'],
  'safeway': ['safeway'],
  'walmart': ['walmart'],
  'kroger': ['kroger'],
  'publix': ['publix'],
  'target': ['target'],
  'costco': ['costco'],
  'sams-club': ["sam's club", 'sams club'],
  'trader-joes': ["trader joe's", 'trader joes'],
  'whole-foods': ['whole foods'],
  'food-lion': ['food lion'],
  'giant': ['giant food', 'giant-food'],
  'stop-and-shop': ['stop & shop', 'stop and shop'],
  'shoprite': ['shoprite'],
  'meijer': ['meijer'],
  'heb': ['h-e-b', 'heb'],
  'wegmans': ['wegmans'],
  'albertsons': ['albertsons'],
  'vons': ['vons'],
  'ralphs': ["ralph's", 'ralphs'],
  'food-4-less': ['food 4 less', 'food4less'],
  'winco': ['winco'],
  'sprouts': ['sprouts'],
  'fresh-market': ['fresh market'],
  'acme': ['acme markets', 'acme'],
  'winn-dixie': ['winn-dixie', 'winn dixie'],
  'piggly-wiggly': ['piggly wiggly'],
  'dollar-general': ['dollar general'],
  'cvs': ['cvs'],
  'walgreens': ['walgreens'],
  'rite-aid': ['rite aid'],
  'bi-lo': ['bi-lo', 'bilo'],
  'food-city': ['food city'],
  'ingles': ['ingles'],
  'harveys': ["harvey's", 'harveys'],
  'frys': ["fry's", 'frys food'],
  'smiths': ["smith's", 'smiths'],
  'king-soopers': ['king soopers'],
  'city-market': ['city market'],
  'marianos': ["mariano's", 'marianos'],
  'jewel-osco': ['jewel-osco', 'jewel osco'],
  'tom-thumb': ['tom thumb'],
  'randalls': ["randall's", 'randalls'],
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      error: 'Missing environment variables',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    }, { status: 500 })
  }

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
      `https://backflipp.wishabi.com/flipp/flyers?locale=en-us&postal_code=${zipCode}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      }
    )

    if (!flyersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch flyers from Flipp', status: flyersResponse.status }, { status: 500 })
    }

    const flyersData = await flyersResponse.json()

    // Flipp API returns { flyers: [...] } or just an array depending on endpoint
    const flyers = Array.isArray(flyersData) ? flyersData : (flyersData.flyers || [])

    console.log(`Found ${flyers.length} flyers for zip code ${zipCode}`)

    if (!Array.isArray(flyers) || flyers.length === 0) {
      return NextResponse.json({ message: 'No flyers found for this zip code', count: 0, zipCode })
    }

    // Log available merchants for debugging
    const availableMerchants = flyers.map((f: { merchant?: string }) => f.merchant).filter(Boolean)
    console.log('Available merchants:', availableMerchants)

    const deals: Record<string, unknown>[] = []

    const matchedStores: string[] = []
    const unmatchedStores: string[] = []
    const flyerDebug: { merchant: string; flyerId: number; itemCount: number }[] = []

    for (const flyer of flyers) {
      const merchant = flyer.merchant || ''
      const storeSlug = matchStore(merchant)

      if (!storeSlug) {
        if (!unmatchedStores.includes(merchant)) unmatchedStores.push(merchant)
        continue
      }

      if (!storeIds[storeSlug]) {
        console.log(`Store ${storeSlug} matched but not in database`)
        continue
      }

      if (!matchedStores.includes(merchant)) matchedStores.push(merchant)

      const flyerId = flyer.id
      const validFrom = flyer.valid_from?.split('T')[0] || null
      const validTo = flyer.valid_to?.split('T')[0] || null

      console.log(`Fetching items from ${merchant} (flyer ${flyerId})...`)

      let items: Record<string, unknown>[] = []
      try {
        // Fetch flyer details which includes items
        const flyerResponse = await fetch(
          `https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-us`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'application/json',
            }
          }
        )
        if (flyerResponse.ok) {
          const flyerData = await flyerResponse.json()
          items = flyerData.items || []
          console.log(`Flyer ${flyerId} (${merchant}): ${items.length} items`)
        } else {
          console.log(`Flyer ${flyerId} response not ok: ${flyerResponse.status}`)
        }
      } catch (e) {
        console.error(`Failed to fetch flyer ${flyerId}:`, e)
        continue
      }

      flyerDebug.push({ merchant, flyerId, itemCount: items.length })

      for (const item of items) {
        const itemName = (String(item.name || '')).trim()
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
            // Capture savings-related fields if available
            original_price: item.original_price || item.was_price || null,
            sale_story: item.sale_story || item.disclaimer || null,
            savings: item.savings || item.discount || null,
            percent_off: item.percent_off || item.discount_percent || null,
          },
        })
      }

      console.log(`  Found ${items.length} items`)
    }

    if (deals.length === 0) {
      return NextResponse.json({
        message: 'No deals found from priority stores',
        count: 0,
        matchedStores,
        flyerDebug,
        priorityStores: Object.keys(PRIORITY_STORES),
        storeIdsInDb: Object.keys(storeIds)
      })
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
