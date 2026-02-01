import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const flyerId = request.nextUrl.searchParams.get('flyer') || '7734923'
  const zip = request.nextUrl.searchParams.get('zip') || '20001'

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
  }

  try {
    const results: Record<string, unknown> = {}

    // Test 1: Single flyer details
    const flyerUrl = `https://backflipp.wishabi.com/flipp/flyers/${flyerId}?locale=en-us`
    const flyerResponse = await fetch(flyerUrl, { headers })
    const flyerText = await flyerResponse.text()
    results.flyer = {
      url: flyerUrl,
      status: flyerResponse.status,
      length: flyerText.length,
      sample: flyerText.slice(0, 1000),
      keys: flyerText.startsWith('{') ? Object.keys(JSON.parse(flyerText)) : null
    }

    // Test 2: Flyer items endpoint
    const itemsUrl = `https://backflipp.wishabi.com/flipp/flyers/${flyerId}/items?locale=en-us`
    const itemsResponse = await fetch(itemsUrl, { headers })
    results.items = {
      url: itemsUrl,
      status: itemsResponse.status,
    }

    // Test 3: Publications endpoint (alternative)
    const pubUrl = `https://backflipp.wishabi.com/flipp/publications/${flyerId}?locale=en-us`
    const pubResponse = await fetch(pubUrl, { headers })
    const pubText = await pubResponse.text()
    results.publication = {
      url: pubUrl,
      status: pubResponse.status,
      length: pubText.length,
      sample: pubText.slice(0, 500),
    }

    // Test 4: Flyers list to see structure
    const listUrl = `https://backflipp.wishabi.com/flipp/flyers?locale=en-us&postal_code=${zip}`
    const listResponse = await fetch(listUrl, { headers })
    const listData = await listResponse.json()
    const firstFlyer = Array.isArray(listData) ? listData[0] : (listData.flyers?.[0] || null)
    results.flyersList = {
      url: listUrl,
      status: listResponse.status,
      firstFlyerKeys: firstFlyer ? Object.keys(firstFlyer) : null,
      firstFlyerSample: firstFlyer,
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
