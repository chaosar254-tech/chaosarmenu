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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createSupabaseAdminClient()

    // Get all branches for this restaurant
    const { data: branches, error: branchesError } = await adminClient
      .from('branches')
      .select('id')
      .eq('restaurant_id', params.id)

    if (branchesError) {
      console.error('Error fetching branches:', branchesError)
    }

    // Extract branch IDs
    const branchIds = branches?.map(b => b.id) || []

    // Get QR codes count (these are still restaurant-scoped)
    const { count: qrCodesCount } = await adminClient
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)

    // Get table-based QR codes count
    const { count: tableQRCodesCount } = await adminClient
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', params.id)
      .not('table_no', 'is', null)

    // If no branches found, return zero menu stats but include QR codes
    if (branchIds.length === 0) {
      return NextResponse.json({
        menu: {
          categories: 0,
          items: 0,
          activeItems: 0,
          inactiveItems: 0,
          arItems: 0,
        },
        qrCodes: {
          total: qrCodesCount || 0,
          tableBased: tableQRCodesCount || 0,
          general: (qrCodesCount || 0) - (tableQRCodesCount || 0),
        },
      })
    }

    // Get menu categories count (from all branches)
    const { count: categoriesCount } = await adminClient
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
      .in('branch_id', branchIds)

    // Get menu items count (from all branches)
    const { count: itemsCount } = await adminClient
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .in('branch_id', branchIds)

    // Get active menu items count (from all branches)
    const { count: activeItemsCount } = await adminClient
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .in('branch_id', branchIds)
      .eq('is_active', true)

    // Get AR enabled items count (from all branches)
    const { count: arItemsCount } = await adminClient
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .in('branch_id', branchIds)
      .eq('has_ar', true)

    return NextResponse.json({
      menu: {
        categories: categoriesCount || 0,
        items: itemsCount || 0,
        activeItems: activeItemsCount || 0,
        inactiveItems: (itemsCount || 0) - (activeItemsCount || 0),
        arItems: arItemsCount || 0,
      },
      qrCodes: {
        total: qrCodesCount || 0,
        tableBased: tableQRCodesCount || 0,
        general: (qrCodesCount || 0) - (tableQRCodesCount || 0),
      },
    })
  } catch (error: any) {
    console.error('Error fetching restaurant stats:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
