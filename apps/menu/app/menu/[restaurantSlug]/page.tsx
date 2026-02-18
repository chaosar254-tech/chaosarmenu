import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

/**
 * Backward compatibility redirect: /menu/[restaurantSlug] -> /menu/[restaurantSlug]/[branchSlug]
 * 
 * This route handles:
 * 1. Restaurant slug only: /menu/restaurant-slug -> redirects to default branch
 * 2. Branch slug only (old QR codes): /menu/branch-slug -> finds restaurant and redirects
 * 3. Invalid slugs: shows 404 with helpful error
 * 
 * If table param is provided, preserve it in the redirect URL.
 */
export default async function LegacyMenuRedirect({
  params,
  searchParams,
}: {
  params: { restaurantSlug: string }
  searchParams: { table?: string }
}) {
  const supabase = createServerSupabaseClient()
  const slug = params.restaurantSlug
  const table = searchParams?.table

  // Log for debugging (dev mode)
  console.log('[Menu Redirect] Received slug:', slug, 'table:', table)

  // Try to find restaurant by slug first
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  console.log('[Menu Redirect] Restaurant lookup:', { slug, found: !!restaurant, error: restaurantError?.message })

  if (restaurant) {
    // Restaurant found - find default branch (first active branch, ordered by created_at)
    const { data: branches } = await supabase
      .from('branches')
      .select('slug')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)

    console.log('[Menu Redirect] Branches for restaurant:', { restaurantId: restaurant.id, branches: branches?.length || 0 })

    if (!branches || branches.length === 0) {
      console.error('[Menu Redirect] No branches found for restaurant:', restaurant.id)
      // Show "No branch configured" page instead of 404
      // We'll create a custom page for this
      redirect(`/menu/${restaurant.slug}/no-branch`)
    }

    const branch = branches[0]
    let redirectUrl = `/menu/${restaurant.slug}/${branch.slug}`
    if (table) {
      redirectUrl += `?table=${encodeURIComponent(table)}`
    }

    console.log('[Menu Redirect] Redirecting restaurant to branch:', redirectUrl)
    redirect(redirectUrl)
  }

  // Restaurant not found - check if it's a branch slug (backward compatibility for old QR codes)
  console.log('[Menu Redirect] Restaurant not found, checking if slug is a branch:', slug)
  
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('slug, restaurant_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)

  console.log('[Menu Redirect] Branch lookup:', { slug, found: branches?.length || 0, error: branchError?.message })

  if (branches && branches.length > 0) {
    const branch = branches[0]
    // Fetch restaurant slug for this branch
    const { data: restaurantForBranch } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', branch.restaurant_id)
      .single()

    if (restaurantForBranch) {
      // Found branch - redirect to proper format: /menu/[restaurantSlug]/[branchSlug]
      let redirectUrl = `/menu/${restaurantForBranch.slug}/${slug}`
      if (table) {
        redirectUrl += `?table=${encodeURIComponent(table)}`
      }
      console.log('[Menu Redirect] Found branch slug, redirecting to:', redirectUrl)
      redirect(redirectUrl)
    } else {
      console.error('[Menu Redirect] Branch found but restaurant lookup failed:', branch.restaurant_id)
    }
  }

  // Not found as restaurant or branch
  console.error('[Menu Redirect] Slug not found as restaurant or branch:', slug)
  notFound()
}
