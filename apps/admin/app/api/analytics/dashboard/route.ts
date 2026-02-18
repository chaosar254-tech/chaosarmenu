import { NextResponse } from 'next/server'
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

// Plan prices (in TL)
const PLAN_PRICES = {
  starter: 990,
  standard: 1490,
  premium: 2490,
}

export async function GET() {
  try {
    const adminClient = createSupabaseAdminClient()

    // Get all restaurants
    const { data: restaurants, error } = await adminClient
      .from('restaurants')
      .select('id, name, plan, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurants:', error)
      return NextResponse.json(
        { error: 'Veriler yüklenemedi' },
        { status: 500 }
      )
    }

    // Calculate monthly registrations (last 12 months)
    const monthlyRegistrations = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const year = date.getFullYear()
      const month = date.getMonth()

      const count = restaurants?.filter((r) => {
        const rDate = new Date(r.created_at)
        return rDate.getFullYear() === year && rDate.getMonth() === month
      }).length || 0

      return {
        month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        count,
      }
    })

    // Calculate plan distribution
    const planDistribution = {
      starter: restaurants?.filter((r) => (r.plan || 'starter') === 'starter').length || 0,
      standard: restaurants?.filter((r) => (r.plan || 'starter') === 'standard').length || 0,
      premium: restaurants?.filter((r) => (r.plan || 'starter') === 'premium').length || 0,
    }

    // Calculate active/passive ratio
    const activePassiveRatio = {
      active: restaurants?.filter((r) => r.is_active !== false).length || 0,
      passive: restaurants?.filter((r) => r.is_active === false).length || 0,
    }

    // Calculate revenue (monthly and yearly)
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()

    // Monthly revenue (current month)
    const monthlyRevenue = restaurants
      ?.filter((r) => {
        const rDate = new Date(r.created_at)
        return rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth
      })
      .reduce((sum, r) => {
        const plan = r.plan || 'starter'
        return sum + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0)
      }, 0) || 0

    // Yearly revenue (current year)
    const yearlyRevenue = restaurants
      ?.filter((r) => {
        const rDate = new Date(r.created_at)
        return rDate.getFullYear() === currentYear
      })
      .reduce((sum, r) => {
        const plan = r.plan || 'starter'
        return sum + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0)
      }, 0) || 0

    // Revenue by plan (monthly)
    const revenueByPlan = {
      starter: restaurants
        ?.filter((r) => {
          const rDate = new Date(r.created_at)
          return rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth
        })
        .filter((r) => (r.plan || 'starter') === 'starter')
        .length * PLAN_PRICES.starter || 0,
      standard: restaurants
        ?.filter((r) => {
          const rDate = new Date(r.created_at)
          return rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth
        })
        .filter((r) => (r.plan || 'starter') === 'standard')
        .length * PLAN_PRICES.standard || 0,
      premium: restaurants
        ?.filter((r) => {
          const rDate = new Date(r.created_at)
          return rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth
        })
        .filter((r) => (r.plan || 'starter') === 'premium')
        .length * PLAN_PRICES.premium || 0,
    }

    return NextResponse.json({
      monthlyRegistrations,
      planDistribution,
      activePassiveRatio,
      revenue: {
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
        byPlan: revenueByPlan,
      },
      totalRestaurants: restaurants?.length || 0,
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
