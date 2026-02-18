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

// GET: Get all QR codes for a restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()
    const restaurantId = params.id

    // Get restaurant to verify it exists
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id, slug')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı' },
        { status: 404 }
      )
    }

    // Get all branches for this restaurant
    const { data: branches } = await adminClient
      .from('branches')
      .select('id, name, slug')
      .eq('restaurant_id', restaurantId)

    // Get all QR codes from restaurant_tables (new structure)
    const { data: tables, error: tablesError } = await adminClient
      .from('restaurant_tables')
      .select('*')
      .in('branch_id', branches?.map(b => b.id) || [])
      .order('created_at', { ascending: false })

    // Also get old qr_codes if they exist
    const { data: oldQRCodes } = await adminClient
      .from('qr_codes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    // Get QR code statistics from menu_events
    const qrIds = [
      ...(tables?.map(t => t.qr_slug) || []),
      ...(oldQRCodes?.map(qr => qr.token || qr.id) || []),
    ]

    const statsMap: Record<string, { scans: number; views: number }> = {}

    if (qrIds.length > 0) {
      const { data: events } = await adminClient
        .from('menu_events')
        .select('qr_id, event_type')
        .eq('restaurant_id', restaurantId)
        .in('qr_id', qrIds)

      // Count events by QR code
      events?.forEach(event => {
        const qrId = event.qr_id as string
        if (!statsMap[qrId]) {
          statsMap[qrId] = { scans: 0, views: 0 }
        }
        if (event.event_type === 'scan') {
          statsMap[qrId].scans++
        } else if (event.event_type === 'page_view') {
          statsMap[qrId].views++
        }
      })
    }

    // Combine tables with branch info and stats
    const qrCodes = (tables || []).map(table => {
      const branch = branches?.find(b => b.id === table.branch_id)
      const stats = statsMap[table.qr_slug] || { scans: 0, views: 0 }

      return {
        id: table.id,
        qr_slug: table.qr_slug,
        name: `Masa ${table.table_no}`,
        table_no: table.table_no,
        branch_id: table.branch_id,
        branch_name: branch?.name || 'N/A',
        branch_slug: branch?.slug || 'N/A',
        is_active: table.is_active,
        created_at: table.created_at,
        scans: stats.scans,
        views: stats.views,
        url: `https://cha0sar.com/menu/${restaurant.slug}/${branch?.slug || 'ana-sub'}?qr=${table.qr_slug}`,
      }
    })

    // Also add old QR codes if they exist
    oldQRCodes?.forEach(oldQR => {
      if (!qrCodes.find(qr => qr.qr_slug === oldQR.token || qr.qr_slug === oldQR.id)) {
        const stats = statsMap[oldQR.token || oldQR.id] || { scans: 0, views: 0 }
        qrCodes.push({
          id: oldQR.id,
          qr_slug: oldQR.token || oldQR.id,
          name: oldQR.name || 'Eski QR Kod',
          table_no: oldQR.table_no?.toString() || 'N/A',
          branch_id: null,
          branch_name: 'Eski Yapı',
          branch_slug: 'N/A',
          is_active: oldQR.is_active ?? true,
          created_at: oldQR.created_at,
          scans: stats.scans,
          views: stats.views,
          url: oldQR.target_path || '',
        })
      }
    })

    return NextResponse.json({ qr_codes: qrCodes })
  } catch (error: any) {
    console.error('Error in GET /api/restaurants/[id]/qr-codes:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// POST: Create a new QR code
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()
    const restaurantId = params.id
    const body = await request.json()
    const { branch_id, table_no, name } = body

    if (!branch_id || !table_no) {
      return NextResponse.json(
        { error: 'Şube ID ve masa numarası gereklidir' },
        { status: 400 }
      )
    }

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await adminClient
      .from('restaurants')
      .select('id, slug')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı' },
        { status: 404 }
      )
    }

    // Verify branch belongs to restaurant
    const { data: branch, error: branchError } = await adminClient
      .from('branches')
      .select('id, slug, restaurant_id')
      .eq('id', branch_id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (branchError || !branch) {
      return NextResponse.json(
        { error: 'Şube bulunamadı veya bu restorana ait değil' },
        { status: 404 }
      )
    }

    // Generate unique QR slug
    const qrSlug = `${restaurant.slug}-${branch.slug}-${table_no}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check for duplicate table_no within this branch (scoped to branch_id)
    const { data: existingTableNo } = await adminClient
      .from('restaurant_tables')
      .select('id')
      .eq('branch_id', branch_id)
      .eq('table_no', table_no.toString())
      .single()

    if (existingTableNo) {
      return NextResponse.json(
        { error: 'Bu şubede bu numaraya sahip bir masa zaten mevcut' },
        { status: 400 }
      )
    }

    // Check for duplicate qr_slug within this branch (scoped to branch_id)
    const { data: existingQrSlug } = await adminClient
      .from('restaurant_tables')
      .select('id')
      .eq('branch_id', branch_id)
      .eq('qr_slug', qrSlug)
      .single()

    if (existingQrSlug) {
      return NextResponse.json(
        { error: 'Bu şubede bu QR slug\'a sahip bir masa zaten mevcut' },
        { status: 400 }
      )
    }

    // Create QR code in restaurant_tables
    const { data: newTable, error: insertError } = await (adminClient
      .from('restaurant_tables') as any)
      .insert({
        branch_id: branch_id,
        table_no: table_no.toString(),
        qr_slug: qrSlug,
        is_active: true,
      } as any)
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation (fallback for database constraint)
        return NextResponse.json(
          { error: 'Bu şubede bu numaraya veya QR slug\'a sahip bir masa zaten mevcut' },
          { status: 400 }
        )
      }
      console.error('Error creating QR code:', insertError)
      return NextResponse.json(
        { error: 'QR kod oluşturulamadı: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qr_code: {
        ...newTable,
        url: `https://cha0sar.com/menu/${restaurant.slug}/${branch.slug}?qr=${qrSlug}`,
      },
    })
  } catch (error: any) {
    console.error('Error in POST /api/restaurants/[id]/qr-codes:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
