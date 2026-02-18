import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
