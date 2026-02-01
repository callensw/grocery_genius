import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const flyerId = request.nextUrl.searchParams.get('flyer') || '7734923' // ALDI flyer from DC

  try {
    // Test items endpoint
    const itemsUrl = `https://backflipp.wishabi.com/flipp/flyers/${flyerId}/items?locale=en-us`
    const itemsResponse = await fetch(itemsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })

    const responseText = await itemsResponse.text()

    return NextResponse.json({
      url: itemsUrl,
      status: itemsResponse.status,
      statusText: itemsResponse.statusText,
      contentType: itemsResponse.headers.get('content-type'),
      responseLength: responseText.length,
      responseSample: responseText.slice(0, 500),
      responseEnd: responseText.slice(-200),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
