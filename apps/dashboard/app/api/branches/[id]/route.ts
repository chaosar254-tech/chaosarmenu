import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET /api/branches/[id] - Get single branch
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

    const { data: branch, error } = await supabase
      .from('branches')
      .select(`
        id,
        name,
        slug,
        address,
        phone,
        is_active,
        created_at,
        restaurant_id,
        restaurants!inner(id, slug, owner_user_id)
      `)
      .eq('id', params.id)
      .single()

    if (error || !branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Verify ownership
    if ((branch.restaurants as any).owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Format response to include restaurant slug separately
    const restaurantsData = branch.restaurants as any
    return NextResponse.json({ 
      branch: {
        ...branch,
        restaurant_slug: restaurantsData.slug,
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/branches/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/branches/[id] - Update branch
export async function PATCH(
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

    // Verify ownership first
    const { data: branch } = await supabase
      .from('branches')
      .select('restaurant_id, restaurants!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (!branch || (branch.restaurants as any).owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Branch not found or forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, address, phone, is_active } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 })
      }
      updateData.slug = slug
    }
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedBranch, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A branch with this slug already exists' }, { status: 400 })
      }
      console.error('Error updating branch:', error)
      return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 })
    }

    return NextResponse.json({ branch: updatedBranch })
  } catch (error: any) {
    console.error('Error in PATCH /api/branches/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/branches/[id] - Delete branch
export async function DELETE(
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

    // Verify ownership
    const { data: branch } = await supabase
      .from('branches')
      .select('restaurant_id, restaurants!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (!branch || (branch.restaurants as any).owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Branch not found or forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting branch:', error)
      return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/branches/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

