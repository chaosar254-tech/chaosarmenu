import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getActiveBranchId, validateBranchAccess } from '@/lib/branch-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/subcategories?category_id=...
 * Returns subcategories for the active branch (from cookie) and optional category filter.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Require authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchId = await getActiveBranchId()
    if (!branchId) {
      return NextResponse.json(
        { error: 'branch_id_missing', message: 'Lütfen önce bir şube seçin.' },
        { status: 400 }
      )
    }

    // Validate branch access and get restaurant_id
    const validation = await validateBranchAccess(supabase, branchId)
    if (!validation.valid || !validation.restaurantId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    const url = new URL(request.url)
    const categoryId = url.searchParams.get('category_id')

    let query = supabase
      .from('menu_subcategories')
      .select('id, name, sort_order, is_active, category_id')
      .eq('branch_id', branchId)
      .eq('restaurant_id', validation.restaurantId)
      .order('sort_order', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Subcategories GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    console.error('[Subcategories GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/subcategories
 * Body: { category_id, name, sort_order? }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category_id, name, sort_order } = body || {}

    const branchId = await getActiveBranchId()
    if (!branchId) {
      return NextResponse.json(
        { error: 'branch_id_missing', message: 'Lütfen önce bir şube seçin.' },
        { status: 400 }
      )
    }

    const validation = await validateBranchAccess(supabase, branchId)
    if (!validation.valid || !validation.restaurantId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    if (!category_id || !name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Missing required fields: category_id, name' },
        { status: 400 }
      )
    }

    // Ensure category belongs to branch (safety on top of DB trigger)
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, branch_id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category || category.branch_id !== branchId) {
      return NextResponse.json(
        { error: 'Category not found for this branch' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('menu_subcategories')
      .insert({
        restaurant_id: validation.restaurantId,
        branch_id: branchId,
        category_id,
        name: name.trim(),
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
      })
      .select('id, name, sort_order, is_active, category_id')
      .single()

    if (error) {
      console.error('[Subcategories POST] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('[Subcategories POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/subcategories
 * Body: { id, name?, sort_order?, is_active? }
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, sort_order, is_active } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const branchId = await getActiveBranchId()
    if (!branchId) {
      return NextResponse.json(
        { error: 'branch_id_missing', message: 'Lütfen önce bir şube seçin.' },
        { status: 400 }
      )
    }

    const validation = await validateBranchAccess(supabase, branchId)
    if (!validation.valid || !validation.restaurantId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    const updateData: any = {}
    if (typeof name === 'string') {
      updateData.name = name.trim()
    }
    if (typeof sort_order === 'number') {
      updateData.sort_order = sort_order
    }
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('menu_subcategories')
      .update(updateData)
      .eq('id', id)
      .eq('branch_id', branchId)
      .eq('restaurant_id', validation.restaurantId)
      .select('id, name, sort_order, is_active, category_id')
      .single()

    if (error) {
      console.error('[Subcategories PUT] update error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    console.error('[Subcategories PUT] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/subcategories
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const branchId = await getActiveBranchId()
    if (!branchId) {
      return NextResponse.json(
        { error: 'branch_id_missing', message: 'Lütfen önce bir şube seçin.' },
        { status: 400 }
      )
    }

    const validation = await validateBranchAccess(supabase, branchId)
    if (!validation.valid || !validation.restaurantId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid branch' },
        { status: validation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    const { error } = await supabase
      .from('menu_subcategories')
      .delete()
      .eq('id', id)
      .eq('branch_id', branchId)
      .eq('restaurant_id', validation.restaurantId)

    if (error) {
      console.error('[Subcategories DELETE] delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('[Subcategories DELETE] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

