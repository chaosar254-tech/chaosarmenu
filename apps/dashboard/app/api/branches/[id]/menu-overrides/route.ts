import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { validateBranchAccess } from '@/lib/branch-utils'

export const dynamic = 'force-dynamic'

// GET /api/branches/[id]/menu-overrides - Get all menu overrides for branch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate branch access
    const validation = await validateBranchAccess(supabase, params.id)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 404 }
      )
    }

    const { data: overrides, error } = await supabase
      .from('branch_menu_overrides')
      .select('*')
      .eq('branch_id', params.id)

    if (error) {
      console.error('Error fetching menu overrides:', error)
      return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 })
    }

    return NextResponse.json({ overrides: overrides || [] })
  } catch (error: any) {
    console.error('Error in GET /api/branches/[id]/menu-overrides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/branches/[id]/menu-overrides - Upsert menu override
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate branch access
    const validation = await validateBranchAccess(supabase, params.id)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 404 }
      )
    }

    const body = await request.json()
    const { menu_item_id, price_override, is_available, stock_status } = body

    if (!menu_item_id) {
      return NextResponse.json({ error: 'menu_item_id is required' }, { status: 400 })
    }

    // Verify menu item belongs to restaurant
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', menu_item_id)
      .single()

    if (!menuItem || menuItem.restaurant_id !== validation.restaurantId) {
      return NextResponse.json({ error: 'Menu item not found or invalid' }, { status: 404 })
    }

    // Upsert override
    const { data: override, error } = await supabase
      .from('branch_menu_overrides')
      .upsert(
        {
          branch_id: params.id,
          menu_item_id,
          price_override: price_override !== undefined ? price_override : null,
          is_available: is_available !== undefined ? is_available : true,
          stock_status: stock_status || 'in_stock',
        },
        { onConflict: 'branch_id,menu_item_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting menu override:', error)
      return NextResponse.json({ error: 'Failed to save override' }, { status: 500 })
    }

    return NextResponse.json({ override })
  } catch (error: any) {
    console.error('Error in POST /api/branches/[id]/menu-overrides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

