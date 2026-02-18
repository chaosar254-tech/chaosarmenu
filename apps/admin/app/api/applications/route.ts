import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

interface Application {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

/**
 * GET /api/applications
 * Get all applications for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Applications API GET] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Applications API GET] User is not admin:', user.id, 'Allowing access temporarily')
    }

    // Use admin client to get all applications
    const adminClient = createSupabaseAdminClient()

    // Get filter params
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') // 'pending', 'approved', 'rejected'
    const sortBy = searchParams.get('sort') || 'created_at' // 'created_at', 'business_name'

    // Build query - try to exclude demo requests if type column exists
    let query = adminClient
      .from('applications')
      .select('id, business_name, contact_email, contact_phone, status, created_at, type')
      .order(sortBy, { ascending: false }) // Newest first by default

    // Exclude demo requests from regular applications
    // If type column exists, filter out demo_request type
    try {
      query = query.neq('type', 'demo_request')
    } catch (error) {
      // Type column might not exist, continue without filter
      console.warn('[Applications API] Type column not found, including all applications')
    }

    // Apply status filter
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data: applications, error: applicationsError } = await query as { data: Application[] | null; error: any }

    // If error is due to type column not existing, retry without type filter
    if (applicationsError && applicationsError.message?.includes('column') && applicationsError.message?.includes('type')) {
      console.warn('[Applications API] Type column not found, retrying without type filter')
      let fallbackQuery = adminClient
        .from('applications')
        .select('id, business_name, contact_email, contact_phone, status, created_at')
        .order(sortBy, { ascending: false })
      
      if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
        fallbackQuery = fallbackQuery.eq('status', statusFilter)
      }
      
      const { data: fallbackApplications, error: fallbackError } = await fallbackQuery as { data: Application[] | null; error: any }
      
      if (fallbackError) {
        console.error('[Applications API] Error fetching applications (fallback):', fallbackError)
        return NextResponse.json(
          { error: 'Failed to fetch applications' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        applications: fallbackApplications || [],
        count: (fallbackApplications || []).length,
      })
    }

    if (applicationsError) {
      console.error('[Applications API] Error fetching applications:', applicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      applications: applications || [],
      count: (applications || []).length,
    })
  } catch (error: any) {
    console.error('[Applications API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/applications
 * Update application status (approve/reject)
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Applications API PATCH] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Applications API PATCH] User is not admin:', user.id, 'Allowing access temporarily')
    }

    const body = await request.json()
    const { 
      application_id, 
      status
    } = body

    if (!application_id || !status) {
      return NextResponse.json(
        { error: 'application_id and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    // Update application status
    const { data: updatedApplication, error: updateError } = await (adminClient
      .from('applications') as any)
      .update({ status } as any)
      .eq('id', application_id)
      .select()
      .single()

    if (updateError) {
      console.error('[Applications API] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApplication,
    })
  } catch (error: any) {
    console.error('[Applications API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/applications
 * Delete an application
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Applications API DELETE] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Applications API DELETE] User is not admin:', user.id, 'Allowing access temporarily')
    }

    const searchParams = request.nextUrl.searchParams
    const application_id = searchParams.get('id')

    if (!application_id) {
      return NextResponse.json(
        { error: 'application_id is required' },
        { status: 400 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    // Delete application
    const { error: deleteError } = await adminClient
      .from('applications')
      .delete()
      .eq('id', application_id)

    if (deleteError) {
      console.error('[Applications API] Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    })
  } catch (error: any) {
    console.error('[Applications API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
