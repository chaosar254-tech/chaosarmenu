import { NextRequest, NextResponse } from 'next/server'
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

// GET: Get QR code statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()
    const restaurantId = params.id
    const { searchParams } = new URL(request.url)
    const qrId = searchParams.get('qr_id')

    // Get all QR codes for this restaurant
    const { data: branches } = await adminClient
      .from('branches')
      .select('id')
      .eq('restaurant_id', restaurantId)

    const { data: tables } = await adminClient
      .from('restaurant_tables')
      .select('qr_slug')
      .in('branch_id', branches?.map(b => b.id) || [])

    const { data: oldQRCodes } = await adminClient
      .from('qr_codes')
      .select('token, id')
      .eq('restaurant_id', restaurantId)

    const allQrIds = [
      ...(tables?.map(t => t.qr_slug) || []),
      ...(oldQRCodes?.map(qr => qr.token || qr.id) || []),
    ]

    if (qrId) {
      // Get stats for specific QR code
      const { data: events } = await adminClient
        .from('menu_events')
        .select('event_type, created_at')
        .eq('restaurant_id', restaurantId)
        .eq('qr_id', qrId)
        .order('created_at', { ascending: false })

      const stats = {
        total_scans: events?.filter(e => e.event_type === 'scan').length || 0,
        total_views: events?.filter(e => e.event_type === 'page_view').length || 0,
        last_scan: events?.find(e => e.event_type === 'scan')?.created_at || null,
        last_view: events?.find(e => e.event_type === 'page_view')?.created_at || null,
        events: events || [],
      }

      return NextResponse.json({ stats })
    } else {
      // Get overall stats for all QR codes
      const { data: events } = await adminClient
        .from('menu_events')
        .select('qr_id, event_type, created_at')
        .eq('restaurant_id', restaurantId)
        .in('qr_id', allQrIds)

      const statsByQr: Record<string, { scans: number; views: number; last_scan: string | null; last_view: string | null }> = {}

      events?.forEach(event => {
        const qrId = event.qr_id as string
        if (!statsByQr[qrId]) {
          statsByQr[qrId] = { scans: 0, views: 0, last_scan: null, last_view: null }
        }
        if (event.event_type === 'scan') {
          statsByQr[qrId].scans++
          if (!statsByQr[qrId].last_scan || event.created_at > statsByQr[qrId].last_scan) {
            statsByQr[qrId].last_scan = event.created_at
          }
        } else if (event.event_type === 'page_view') {
          statsByQr[qrId].views++
          if (!statsByQr[qrId].last_view || event.created_at > statsByQr[qrId].last_view) {
            statsByQr[qrId].last_view = event.created_at
          }
        }
      })

      const totalScans = events?.filter(e => e.event_type === 'scan').length || 0
      const totalViews = events?.filter(e => e.event_type === 'page_view').length || 0

      return NextResponse.json({
        total_qr_codes: allQrIds.length,
        total_scans: totalScans,
        total_views: totalViews,
        by_qr: statsByQr,
      })
    }
  } catch (error: any) {
    console.error('Error in GET /api/restaurants/[id]/qr-codes/stats:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
