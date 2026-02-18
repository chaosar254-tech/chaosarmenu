import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/google/place-details?placeId=...
 * Fetch Google Places API details and update restaurant cache
 * 
 * Caching: If google_rating_updated_at < 24h ago, return cached values
 * Otherwise, fetch from Google Places API and update cache
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get restaurant owned by user
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, google_place_id, google_rating, google_review_count, google_rating_updated_at')
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { ok: false, error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    const placeId = request.nextUrl.searchParams.get('placeId') || restaurant.google_place_id

    if (!placeId) {
      return NextResponse.json(
        { ok: false, error: 'Google Place ID is required' },
        { status: 400 }
      )
    }

    // Validate Place ID format: must start with "ChIJ" and be at least 10 chars
    const trimmedPlaceId = placeId.trim()
    if (!trimmedPlaceId.startsWith('ChIJ') || trimmedPlaceId.length < 10) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Place ID format. Place ID must start with "ChIJ" and be at least 10 characters long.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.warn('[Google Places API] GOOGLE_PLACES_API_KEY not configured')
      return NextResponse.json(
        { ok: false, error: 'GOOGLE_PLACES_API_KEY missing' },
        { status: 400 }
      )
    }

    // Check cache: if updated < 24h ago, return cached values
    const now = new Date()
    const cacheAge = restaurant.google_rating_updated_at
      ? now.getTime() - new Date(restaurant.google_rating_updated_at).getTime()
      : Infinity
    const cacheMaxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (cacheAge < cacheMaxAge && restaurant.google_rating !== null && restaurant.google_review_count !== null) {
      const cachedRating = Number(restaurant.google_rating)
      const cachedReviewCount = Number(restaurant.google_review_count)
      
      // Only return cached data if values are valid (> 0)
      if (!isNaN(cachedRating) && cachedRating > 0 && !isNaN(cachedReviewCount) && cachedReviewCount > 0) {
        console.log('[Google Places API] Returning cached data (age:', Math.floor(cacheAge / 1000 / 60), 'minutes)')
        return NextResponse.json({
          ok: true,
          rating: cachedRating,
          reviewCount: cachedReviewCount,
          name: null,
          cached: true,
          updated_at: restaurant.google_rating_updated_at,
        })
      }
      // If cached data is invalid, fall through to fetch fresh data
    }

    // Fetch from Google Places API
    console.log('[Google Places API] Fetching fresh data for place_id:', trimmedPlaceId)
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(trimmedPlaceId)}&fields=rating,user_ratings_total,name&key=${apiKey}`

    const response = await fetch(googleApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[Google Places API] HTTP error:', response.status, response.statusText)
      // Return cached data if available and valid
      if (restaurant.google_rating !== null && restaurant.google_review_count !== null) {
        const cachedRating = Number(restaurant.google_rating)
        const cachedReviewCount = Number(restaurant.google_review_count)
        if (!isNaN(cachedRating) && cachedRating > 0 && !isNaN(cachedReviewCount) && cachedReviewCount > 0) {
          return NextResponse.json({
            ok: true,
            rating: cachedRating,
            reviewCount: cachedReviewCount,
            name: null,
            cached: true,
            message: 'Using cached data (API request failed)',
          })
        }
      }
      return NextResponse.json(
        { ok: false, error: `Google Places API HTTP error: ${response.status} ${response.statusText}` },
        { status: 400 }
      )
    }

    const data = await response.json()

    // Handle Google Places API error statuses
    if (data.status === 'REQUEST_DENIED') {
      console.error('[Google Places API] REQUEST_DENIED:', data.error_message)
      return NextResponse.json(
        { ok: false, error: `Google Places API access denied: ${data.error_message || 'Check API key permissions and billing'}` },
        { status: 400 }
      )
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error('[Google Places API] INVALID_REQUEST:', data.error_message)
      return NextResponse.json(
        { ok: false, error: `Invalid Place ID: ${data.error_message || 'Place ID format is incorrect'}` },
        { status: 400 }
      )
    }

    if (data.status !== 'OK') {
      console.error('[Google Places API] API error status:', data.status, data.error_message)
      // Return cached data if available and valid
      if (restaurant.google_rating !== null && restaurant.google_review_count !== null) {
        const cachedRating = Number(restaurant.google_rating)
        const cachedReviewCount = Number(restaurant.google_review_count)
        if (!isNaN(cachedRating) && cachedRating > 0 && !isNaN(cachedReviewCount) && cachedReviewCount > 0) {
          return NextResponse.json({
            ok: true,
            rating: cachedRating,
            reviewCount: cachedReviewCount,
            name: null,
            cached: true,
            message: `Using cached data (API error: ${data.status})`,
          })
        }
      }
      const errorMessage = data.status === 'NOT_FOUND' 
        ? 'Place ID bulunamadı. Lütfen geçerli bir Place ID girin.'
        : data.status === 'OVER_QUERY_LIMIT'
        ? 'Google Places API quota aşıldı. Lütfen daha sonra tekrar deneyin.'
        : `Google Places API hatası: ${data.status} - ${data.error_message || 'Bilinmeyen hata'}`
      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: 400 }
      )
    }

    if (!data.result) {
      console.error('[Google Places API] No result in response:', data)
      // Return cached data if available and valid
      if (restaurant.google_rating !== null && restaurant.google_review_count !== null) {
        const cachedRating = Number(restaurant.google_rating)
        const cachedReviewCount = Number(restaurant.google_review_count)
        if (!isNaN(cachedRating) && cachedRating > 0 && !isNaN(cachedReviewCount) && cachedReviewCount > 0) {
          return NextResponse.json({
            ok: true,
            rating: cachedRating,
            reviewCount: cachedReviewCount,
            name: null,
            cached: true,
            message: 'Using cached data (no result from API)',
          })
        }
      }
      return NextResponse.json(
        { ok: false, error: 'Place ID için veri bulunamadı. Place ID\'nin doğru olduğundan emin olun.' },
        { status: 404 }
      )
    }

    // Extract rating and review count, ensuring they're valid numbers
    const rating = (data.result.rating !== null && data.result.rating !== undefined && !isNaN(Number(data.result.rating)))
      ? Number(data.result.rating)
      : null
    const reviewCount = (data.result.user_ratings_total !== null && data.result.user_ratings_total !== undefined && !isNaN(Number(data.result.user_ratings_total)))
      ? Number(data.result.user_ratings_total)
      : null
    const placeName = data.result.name || null

    // Only update cache if we have valid data (rating > 0, reviewCount > 0)
    if (rating !== null && rating > 0 && reviewCount !== null && reviewCount > 0) {
      const updateData: any = {
        google_rating: rating,
        google_review_count: reviewCount,
        google_rating_updated_at: new Date().toISOString(),
      }

      // Update place_id if it was passed as a parameter (different from stored)
      if (trimmedPlaceId && trimmedPlaceId !== restaurant.google_place_id) {
        updateData.google_place_id = trimmedPlaceId
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id)

      if (updateError) {
        console.error('[Google Places API] Error updating cache:', updateError)
        // Still return the fetched data even if cache update fails
      }

      console.log('[Google Places API] Successfully fetched and cached:', { rating, reviewCount, name: placeName })

      return NextResponse.json({
        ok: true,
        rating,
        reviewCount,
        name: placeName,
        cached: false,
        updated_at: updateData.google_rating_updated_at,
      })
    } else {
      // API returned data but rating/reviewCount is invalid (null or 0)
      console.warn('[Google Places API] Invalid data returned from API:', { rating, reviewCount })
      return NextResponse.json(
        { ok: false, error: 'Place ID için geçerli rating veya yorum sayısı bulunamadı.' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[Google Places API] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

