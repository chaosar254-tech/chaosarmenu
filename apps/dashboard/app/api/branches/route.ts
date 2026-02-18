import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { cloneBranchMenu } from '@/lib/branch-menu-clone'

export const dynamic = 'force-dynamic'

// GET /api/branches - List branches for restaurant
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get branches for restaurant
    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name, slug, address, phone, is_active, created_at')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
      return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
    }

    return NextResponse.json({ branches: branches || [] })
  } catch (error: any) {
    console.error('Error in GET /api/branches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's restaurant with permission
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, can_add_branches')
      .eq('owner_user_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Check if restaurant has permission to add branches
    if (!restaurant.can_add_branches) {
      return NextResponse.json(
        { error: 'Şube ekleme izniniz bulunmuyor. Lütfen admin ile iletişime geçin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, address, phone, is_active = true, copy_menu_from_branch_id } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Validate slug format (URL-friendly)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 })
    }

    // If copying menu, validate source branch belongs to same restaurant
    if (copy_menu_from_branch_id) {
      const { data: sourceBranch } = await supabase
        .from('branches')
        .select('id, restaurant_id')
        .eq('id', copy_menu_from_branch_id)
        .single()

      if (!sourceBranch || sourceBranch.restaurant_id !== restaurant.id) {
        return NextResponse.json({ error: 'Source branch not found or access denied' }, { status: 403 })
      }
    }

    // Create branch
    const { data: branch, error } = await supabase
      .from('branches')
      .insert({
        restaurant_id: restaurant.id,
        name,
        slug,
        address: address || null,
        phone: phone || null,
        is_active,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'A branch with this slug already exists' }, { status: 400 })
      }
      console.error('Error creating branch:', error)
      return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
    }

    // Create empty branch_social record
    await supabase
      .from('branch_social')
      .insert({ branch_id: branch.id })

    // Clone menu from source branch if specified
    if (copy_menu_from_branch_id) {
      try {
        await cloneBranchMenu(supabase, copy_menu_from_branch_id, branch.id, restaurant.id)
        console.log(`[Branch Creation] Cloned menu from branch ${copy_menu_from_branch_id} to ${branch.id}`)
      } catch (cloneError: any) {
        console.error('[Branch Creation] Error cloning menu:', cloneError)
        // Don't fail branch creation if cloning fails - branch is created, just log error
        // User can manually copy items if needed
      }
    }

    return NextResponse.json({ branch })
  } catch (error: any) {
    console.error('Error in POST /api/branches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

