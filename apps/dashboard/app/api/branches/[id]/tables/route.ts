import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { validateBranchAccess } from '@/lib/branch-utils'

export const dynamic = 'force-dynamic'

// GET /api/branches/[id]/tables - Get all tables for branch
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

    const { data: tables, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('branch_id', params.id)
      .order('table_no', { ascending: true })

    if (error) {
      console.error('Error fetching tables:', error)
      return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
    }

    return NextResponse.json({ tables: tables || [] })
  } catch (error: any) {
    console.error('Error in GET /api/branches/[id]/tables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/branches/[id]/tables - Create new table
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
    const { table_no, qr_slug, is_active = true } = body

    if (!table_no) {
      return NextResponse.json({ error: 'table_no is required' }, { status: 400 })
    }

    // Generate unique qr_slug if not provided (use branch slug + table number)
    let finalQrSlug = qr_slug
    if (!finalQrSlug) {
      const { data: branch } = await supabase
        .from('branches')
        .select('slug')
        .eq('id', params.id)
        .single()
      
      finalQrSlug = `${branch?.slug || 'table'}-${table_no}-${Date.now()}`
    }

    // Check for duplicate table_no within this branch (scoped to branch_id)
    const { data: existingTableNo } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('branch_id', params.id)
      .eq('table_no', String(table_no))
      .single()

    if (existingTableNo) {
      return NextResponse.json(
        { error: 'A table with this number already exists in this branch' },
        { status: 400 }
      )
    }

    // Check for duplicate qr_slug within this branch (scoped to branch_id)
    const { data: existingQrSlug } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('branch_id', params.id)
      .eq('qr_slug', finalQrSlug)
      .single()

    if (existingQrSlug) {
      return NextResponse.json(
        { error: 'A table with this QR slug already exists in this branch' },
        { status: 400 }
      )
    }

    const { data: table, error } = await supabase
      .from('restaurant_tables')
      .insert({
        branch_id: params.id,
        table_no: String(table_no),
        qr_slug: finalQrSlug,
        is_active,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation (fallback for database constraint)
        return NextResponse.json(
          { error: 'A table with this number or QR slug already exists in this branch' },
          { status: 400 }
        )
      }
      console.error('Error creating table:', error)
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
    }

    return NextResponse.json({ table })
  } catch (error: any) {
    console.error('Error in POST /api/branches/[id]/tables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

