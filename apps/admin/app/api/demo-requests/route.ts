import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

interface DemoRequest {
  id: string
  business_name: string
  contact_email: string
  contact_phone: string
  full_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

/**
 * GET /api/demo-requests
 * Get all demo requests (applications with type='demo_request')
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
      console.warn('[Demo Requests API GET] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Demo Requests API GET] User is not admin:', user.id, 'Allowing access temporarily')
    }

    // Use admin client to get all demo requests
    const adminClient = createSupabaseAdminClient()

    // Get filter params
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') // 'pending', 'approved', 'rejected'
    const sortBy = searchParams.get('sort') || 'created_at' // 'created_at', 'business_name'

    // Try to query applications with type='demo_request'
    // If type column doesn't exist, return empty array instead of crashing
    try {
      let query = adminClient
        .from('applications')
        .select('id, business_name, contact_email, contact_phone, full_name, status, created_at, type')
        .eq('type', 'demo_request')
        .order(sortBy, { ascending: false }) // Newest first by default

      // Apply status filter
      if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
        query = query.eq('status', statusFilter)
      }

      const { data: demoRequests, error: demoRequestsError } = await query as { data: DemoRequest[] | null; error: any }

      if (demoRequestsError) {
        // Log the exact error for debugging
        console.error('[Demo Requests API] Query error details:', {
          message: demoRequestsError.message,
          details: demoRequestsError.details,
          hint: demoRequestsError.hint,
          code: demoRequestsError.code,
        })

        // Check if error is due to missing type column
        const errorMessage = demoRequestsError.message?.toLowerCase() || ''
        const errorDetails = demoRequestsError.details?.toLowerCase() || ''
        const errorHint = demoRequestsError.hint?.toLowerCase() || ''
        
        const isTypeColumnError = 
          errorMessage.includes('column') && errorMessage.includes('type') ||
          errorDetails.includes('column') && errorDetails.includes('type') ||
          errorHint.includes('column') && errorHint.includes('type') ||
          demoRequestsError.code === 'PGRST116' || // PostgREST error code for column not found
          errorMessage.includes('does not exist')

        if (isTypeColumnError) {
          console.warn('[Demo Requests API] Type column not found in applications table. Returning empty array.')
          console.warn('[Demo Requests API] To fix: Add type column to applications table: ALTER TABLE applications ADD COLUMN type TEXT;')
          return NextResponse.json({ 
            demoRequests: [],
            count: 0,
            warning: 'Type column not found in applications table. Please add it to enable demo request filtering.',
          })
        }
        
        // For other errors, still return empty array instead of 500
        console.error('[Demo Requests API] Unexpected query error:', demoRequestsError)
        return NextResponse.json({ 
          demoRequests: [],
          count: 0,
          error: 'Failed to fetch demo requests',
          errorDetails: process.env.NODE_ENV === 'development' ? demoRequestsError.message : undefined,
        })
      }

      return NextResponse.json({ 
        demoRequests: demoRequests || [],
        count: (demoRequests || []).length,
      })
    } catch (queryError: any) {
      // Catch any unexpected errors during query construction
      console.error('[Demo Requests API] Unexpected error during query:', {
        message: queryError.message,
        stack: queryError.stack,
        name: queryError.name,
      })
      
      // Return empty array instead of crashing
      return NextResponse.json({ 
        demoRequests: [],
        count: 0,
        error: 'Failed to fetch demo requests',
        errorDetails: process.env.NODE_ENV === 'development' ? queryError.message : undefined,
      })
    }
  } catch (error: any) {
    console.error('[Demo Requests API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
