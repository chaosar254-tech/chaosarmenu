import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurant/settings
 * Get current restaurant social media and review settings
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant owned by user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, google_place_id, google_review_url, instagram_url, tiktok_url, x_url, twitter_url, google_rating, google_review_count, google_rating_updated_at')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      google_place_id: restaurant.google_place_id || null,
      google_review_url: restaurant.google_review_url || null,
      instagram_url: restaurant.instagram_url || null,
      tiktok_url: restaurant.tiktok_url || null,
      x_url: restaurant.x_url || restaurant.twitter_url || null,
      google_rating: restaurant.google_rating || null,
      google_review_count: restaurant.google_review_count || null,
      google_rating_updated_at: restaurant.google_rating_updated_at || null,
    })
  } catch (error: any) {
    console.error('GET /api/restaurant/settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/restaurant/settings
 * Update restaurant social media and review settings
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('[Server] PATCH /api/restaurant/settings')
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant owned by user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('[Server] PATCH /api/restaurant/settings body:', body)

    const {
      google_place_id,
      google_review_url,
      instagram_url,
      tiktok_url,
      x_url,
    } = body

    // Note: google_rating and google_review_count are NOT updated here
    // They are fetched from Google Places API via /api/google/place-details

    // Validation
    const errors: string[] = []

    // URL validation helper - only validate if non-null
    // Returns { valid: true, value: string } or { valid: false, error: string }
    const validateUrl = (url: string | null | undefined, fieldName: string, allowedDomains?: string[]): { valid: boolean; value: string | null; error?: string } => {
      // Accept null/undefined as valid (field is optional)
      if (url === null || url === undefined) {
        return { valid: true, value: null }
      }
      
      // Empty string treated as null
      const trimmed = typeof url === 'string' ? url.trim() : String(url).trim()
      if (trimmed === '') {
        return { valid: true, value: null }
      }
      
      // Must start with http:// or https://
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return {
          valid: false,
          value: null,
          error: `${fieldName} geçerli bir URL olmalıdır (http:// veya https:// ile başlamalı)`
        }
      }

      // Domain validation if provided
      if (allowedDomains && allowedDomains.length > 0) {
        try {
          const urlObj = new URL(trimmed)
          const hostname = urlObj.hostname.toLowerCase()
          const isValidDomain = allowedDomains.some(domain => 
            hostname === domain || hostname.endsWith(`.${domain}`)
          )
          if (!isValidDomain) {
            return {
              valid: false,
              value: null,
              error: `${fieldName} geçerli bir ${allowedDomains.join(' veya ')} URL'i olmalıdır`
            }
          }
        } catch {
          return {
            valid: false,
            value: null,
            error: `${fieldName} geçerli bir URL formatı değil`
          }
        }
      }

      return { valid: true, value: trimmed }
    }

    // Validate Google Place ID (optional but if provided, should be non-empty string)
    const validatedGooglePlaceId = google_place_id === null || google_place_id === undefined || (typeof google_place_id === 'string' && google_place_id.trim() === '')
      ? null
      : String(google_place_id).trim()

    // Validate URLs (only if non-null)
    const googleReviewResult = validateUrl(google_review_url, 'Google Yorum Linki')
    if (!googleReviewResult.valid) {
      errors.push(googleReviewResult.error!)
    }
    const validatedGoogleReviewUrl = googleReviewResult.value

    const instagramResult = validateUrl(instagram_url, 'Instagram Linki', ['instagram.com'])
    if (!instagramResult.valid) {
      errors.push(instagramResult.error!)
    }
    const validatedInstagramUrl = instagramResult.value

    const tiktokResult = validateUrl(tiktok_url, 'TikTok Linki', ['tiktok.com'])
    if (!tiktokResult.valid) {
      errors.push(tiktokResult.error!)
    }
    const validatedTiktokUrl = tiktokResult.value

    const xResult = validateUrl(x_url, 'X (Twitter) Linki', ['x.com', 'twitter.com'])
    if (!xResult.valid) {
      errors.push(xResult.error!)
    }
    const validatedXUrl = xResult.value

    if (errors.length > 0) {
      console.error('[Server] Validation errors:', errors)
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      )
    }

    // Build update data
    // At this point, all validations have passed (or we would have returned early)
    // Note: google_rating and google_review_count are NOT updated here - they come from Google Places API
    const updateData: any = {
      google_place_id: validatedGooglePlaceId,
      google_review_url: validatedGoogleReviewUrl,
      instagram_url: validatedInstagramUrl,
      tiktok_url: validatedTiktokUrl,
      x_url: validatedXUrl,
      twitter_url: validatedXUrl, // Also update twitter_url for backward compatibility
    }

    console.log('[Server] Update data:', updateData)

    const { error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurant.id)

    if (updateError) {
      console.error('[Server] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    console.log('[Server] Update successful')
    return NextResponse.json({
      success: true,
      message: 'Ayarlar başarıyla güncellendi',
    })
  } catch (error: any) {
    console.error('[Server] PATCH /api/restaurant/settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

