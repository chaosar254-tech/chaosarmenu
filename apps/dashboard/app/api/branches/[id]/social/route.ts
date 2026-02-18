import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET /api/branches/[id]/social - Get branch social settings
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

    // Verify ownership
    const { data: branch } = await supabase
      .from('branches')
      .select('restaurant_id, restaurants!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (!branch || (branch.restaurants as any).owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Branch not found or forbidden' }, { status: 403 })
    }

    const { data: social, error } = await supabase
      .from('branch_social')
      .select('*')
      .eq('branch_id', params.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching branch social:', error)
      return NextResponse.json({ error: 'Failed to fetch social settings' }, { status: 500 })
    }

    // Return empty object if no social settings exist yet
    return NextResponse.json({ 
      social: social || {
        branch_id: params.id,
        google_review_url: null,
        google_place_id: null,
        instagram_url: null,
        tiktok_url: null,
        x_url: null,
        website_url: null,
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/branches/[id]/social:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/branches/[id]/social - Update branch social settings
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

    // Verify ownership
    const { data: branch } = await supabase
      .from('branches')
      .select('restaurant_id, restaurants!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (!branch || (branch.restaurants as any).owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Branch not found or forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { google_review_url, google_place_id, instagram_url, tiktok_url, x_url, website_url } = body

    const updateData: any = {
      branch_id: params.id,
    }
    if (google_review_url !== undefined) updateData.google_review_url = google_review_url || null
    if (google_place_id !== undefined) updateData.google_place_id = google_place_id || null
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url || null
    if (tiktok_url !== undefined) updateData.tiktok_url = tiktok_url || null
    if (x_url !== undefined) updateData.x_url = x_url || null
    if (website_url !== undefined) updateData.website_url = website_url || null

    // Upsert (insert or update)
    const { data: social, error } = await supabase
      .from('branch_social')
      .upsert(updateData, { onConflict: 'branch_id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating branch social:', error)
      return NextResponse.json({ error: 'Failed to update social settings' }, { status: 500 })
    }

    return NextResponse.json({ social })
  } catch (error: any) {
    console.error('Error in PATCH /api/branches/[id]/social:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

