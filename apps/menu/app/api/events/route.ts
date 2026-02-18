import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurant_id, qr_id, event_type, item_id, meta } = body

    if (!restaurant_id || !event_type) {
      return NextResponse.json(
        { error: 'restaurant_id and event_type are required' },
        { status: 400 }
      )
    }

    if (!['page_view', 'scan', 'item_view', 'error'].includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('menu_events')
      .insert({
        restaurant_id,
        qr_id: qr_id || null,
        event_type,
        item_id: item_id || null,
        meta: meta || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[Events API] Error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, event: data })
  } catch (error: any) {
    console.error('[Events API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

