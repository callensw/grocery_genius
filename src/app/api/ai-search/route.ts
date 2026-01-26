import { NextRequest, NextResponse } from 'next/server'

interface SearchIntent {
  search_terms: string[]
  category: string | null
  sort_by: 'price' | 'savings' | null
  limit: number | null
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback to simple keyword extraction if no API key
      return NextResponse.json({
        searchTerms: query.toLowerCase().split(' ').filter((w: string) => w.length > 2),
        category: null,
        sortBy: null,
      })
    }

    // Dynamically import and instantiate OpenAI only when needed
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that parses grocery deal search queries.
Given a user query, extract the search intent and return JSON with these fields:
- search_terms: array of keywords to search for in item names
- category: one of [produce, meat, dairy, pantry, frozen, bakery, beverages, snacks, household, other] or null
- sort_by: "price" if they want cheapest, "savings" if they want best deals, or null
- limit: number of results they want, or null for default

Examples:
- "cheapest chicken" -> {"search_terms": ["chicken"], "category": "meat", "sort_by": "price", "limit": null}
- "best protein deals" -> {"search_terms": ["chicken", "beef", "pork", "turkey", "fish", "eggs"], "category": "meat", "sort_by": "price", "limit": null}
- "avocados on sale" -> {"search_terms": ["avocado"], "category": "produce", "sort_by": null, "limit": null}
- "dairy under $5" -> {"search_terms": [], "category": "dairy", "sort_by": "price", "limit": null}

Return only valid JSON, no explanation.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'

    try {
      const intent: SearchIntent = JSON.parse(responseText)

      return NextResponse.json({
        searchTerms: intent.search_terms || [],
        category: intent.category || null,
        sortBy: intent.sort_by || null,
        limit: intent.limit || null,
      })
    } catch {
      // If JSON parsing fails, fall back to simple extraction
      return NextResponse.json({
        searchTerms: query.toLowerCase().split(' ').filter((w: string) => w.length > 2),
        category: null,
        sortBy: null,
      })
    }
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json(
      { error: 'Failed to process search query' },
      { status: 500 }
    )
  }
}
