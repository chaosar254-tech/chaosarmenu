import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { validateBranchAccess } from '@/lib/branch-utils'

export const dynamic = 'force-dynamic'

// PATCH /api/branches/[id]/tables/[tableId] - Update table
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
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

    // Verify table belongs to branch
    const { data: table } = await supabase
      .from('restaurant_tables')
      .select('branch_id')
      .eq('id', params.tableId)
      .single()

    if (!table || table.branch_id !== params.id) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { table_no, qr_slug, is_active } = body

    // Check for duplicates BEFORE updating (scoped to branch_id)
    if (table_no !== undefined) {
      const { data: existingTableNo } = await supabase
        .from('restaurant_tables')
        .select('id')
        .eq('branch_id', params.id)
        .eq('table_no', String(table_no))
        .neq('id', params.tableId) // Exclude current table
        .single()

      if (existingTableNo) {
        return NextResponse.json(
          { error: 'A table with this number already exists in this branch' },
          { status: 400 }
        )
      }
    }

    if (qr_slug !== undefined) {
      const { data: existingQrSlug } = await supabase
        .from('restaurant_tables')
        .select('id')
        .eq('branch_id', params.id)
        .eq('qr_slug', qr_slug)
        .neq('id', params.tableId) // Exclude current table
        .single()

      if (existingQrSlug) {
        return NextResponse.json(
          { error: 'A table with this QR slug already exists in this branch' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (table_no !== undefined) updateData.table_no = String(table_no)
    if (qr_slug !== undefined) updateData.qr_slug = qr_slug
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedTable, error } = await supabase
      .from('restaurant_tables')
      .update(updateData)
      .eq('id', params.tableId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation (fallback for database constraint)
        return NextResponse.json(
          { error: 'A table with this number or QR slug already exists in this branch' },
          { status: 400 }
        )
      }
      console.error('Error updating table:', error)
      return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
    }

    return NextResponse.json({ table: updatedTable })
  } catch (error: any) {
    console.error('Error in PATCH /api/branches/[id]/tables/[tableId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/branches/[id]/tables/[tableId] - Delete table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
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

    // Verify table belongs to branch
    const { data: table } = await supabase
      .from('restaurant_tables')
      .select('branch_id')
      .eq('id', params.tableId)
      .single()

    if (!table || table.branch_id !== params.id) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', params.tableId)

    if (error) {
      console.error('Error deleting table:', error)
      return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/branches/[id]/tables/[tableId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

