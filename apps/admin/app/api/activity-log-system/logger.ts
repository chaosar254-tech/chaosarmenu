import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Hardcode Supabase Admin Client (Service Role Key)
const SUPABASE_URL = "https://kenrjnphvocixvbbvwvy.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_yJn8IqcaYnf9gJAZXshjqg_rUygjxTL"

const createSupabaseAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper function to log activity
export async function logActivity(
  adminUserId: string,
  actionType: string,
  entityType: string,
  entityId?: string,
  changes?: any,
  description?: string,
  request?: NextRequest
) {
  try {
    const adminClient = createSupabaseAdminClient()

    const ipAddress = request?.headers.get('x-forwarded-for') || 
                      request?.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request?.headers.get('user-agent') || 'unknown'

    const { error } = await (adminClient
      .from('activity_logs') as any)
      .insert({
        admin_user_id: adminUserId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
        description,
        ip_address: ipAddress,
        user_agent: userAgent,
      } as any)

    if (error) {
      console.error('Error logging activity:', error)
    }
  } catch (error) {
    console.error('Error in logActivity:', error)
  }
}

// GET: Fetch activity logs
export async function GET(request: NextRequest) {
  try {
    const adminClient = createSupabaseAdminClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const actionType = searchParams.get('action_type')
    const entityType = searchParams.get('entity_type')

    // Build query - Service role bypasses RLS, so we can query directly
    let query = adminClient
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json(
        { error: 'Loglar yüklenemedi' },
        { status: 500 }
      )
    }

    // Get admin user emails for each log
    const logsWithUserInfo = []
    if (logs) {
      for (const log of logs) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            log.admin_user_id
          )
          logsWithUserInfo.push({
            ...log,
            admin_user: {
              id: userData?.user?.id || null,
              email: userData?.user?.email || 'N/A',
            },
          })
        } catch (userError) {
          console.error('Error fetching user for log:', log.id, userError)
          logsWithUserInfo.push({
            ...log,
            admin_user: {
              id: null,
              email: 'N/A',
            },
          })
        }
      }
    }

    return NextResponse.json({
      logs: logsWithUserInfo,
      total: count || 0,
    })
  } catch (error: any) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}


//güncelleme213