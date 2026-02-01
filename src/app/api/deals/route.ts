import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const storeSlug = searchParams.get('store')
  const category = searchParams.get('category')
  const search = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '100', 10)

  const supabase = await createClient()

  // Build the query
  let query = supabase
    .from('gg_deals')
    .select('*, gg_stores(*)')
    .gte('valid_to', new Date().toISOString().split('T')[0])
    .order('price_numeric', { ascending: true, nullsFirst: false })
    .limit(limit)

  // Filter by store
  if (storeSlug) {
    const { data: store } = await supabase
      .from('gg_stores')
      .select('id')
      .eq('slug', storeSlug)
      .single()

    const storeData = store as { id: string } | null
    if (storeData) {
      query = query.eq('store_id', storeData.id)
    }
  }

  // Filter by category
  if (category) {
    query = query.eq('category', category)
  }

  // Search by item name
  if (search) {
    query = query.ilike('item_name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
