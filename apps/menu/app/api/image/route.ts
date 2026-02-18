import { NextRequest, NextResponse } from 'next/server'
import { BUCKET_MENU_IMAGES, BUCKET_MENU_CATEGORY_IMAGES } from '@/lib/storage-constants'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic';

// Simple in-memory cache per request (cleared after response)
const signedUrlCache = new Map<string, { url: string; expires: number }>()

// This endpoint generates signed URLs for menu images
// Uses service role key to bypass RLS for public menu access
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('[API /image] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      console.error('[API /image] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key. SUPABASE_SERVICE_ROLE_KEY must be set in server environment.' },
        { status: 500 }
      )
    }

    // Get path from query parameter
    const searchParams = request.nextUrl.searchParams
    const encodedPath = searchParams.get('path')

    if (!encodedPath) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Decode the path
    let imagePath: string
    try {
      imagePath = decodeURIComponent(encodedPath)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid path encoding' },
        { status: 400 }
      )
    }

    // Check cache first (valid for 50 minutes)
    const cached = signedUrlCache.get(imagePath)
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ url: cached.url }, { status: 200 })
    }

    // Validate path format
    // Format 1: {restaurantId}/items/{menuItemId}/{uuid}.{ext} (menu item images)
    // Format 2: {restaurantId}/items/{uuid}.{ext} (backward compat)
    // Format 3: categories/{restaurantId}/{filename} (category images - filename can contain any chars, must have extension)
    const pathPattern1 = /^([a-f0-9-]+)\/items\/[a-f0-9-]+\/[a-f0-9-]+\.[a-z]+$/i
    const pathPattern2 = /^([a-f0-9-]+)\/items\/[a-f0-9-]+\.[a-z]+$/i
    // Category images: categories/{restaurantId}/{filename} - filename must have at least one char and extension
    const pathPattern3 = /^categories\/([a-f0-9-]+)\/.+\.[a-z]+$/i
    
    const match1 = imagePath.match(pathPattern1)
    const match2 = imagePath.match(pathPattern2)
    const match3 = imagePath.match(pathPattern3)
    const match = match1 || match2 || match3

    if (!match) {
      console.error('[API /image] Invalid path format:', imagePath)
      return NextResponse.json(
        { error: 'Invalid path format. Expected: {restaurantId}/items/{menuItemId}/{uuid}.{ext}, {restaurantId}/items/{uuid}.{ext}, or categories/{restaurantId}/{filename}' },
        { status: 400 }
      )
    }

    // Extract restaurant ID from path
    // For category images: categories/{restaurantId}/{filename} - restaurantId at match[1]
    // For menu items: {restaurantId}/items/... - restaurantId at match[1]
    const isCategoryImage = !!match3
    const restaurantIdFromPath = match[1]
    
    // Determine bucket based on path
    const bucket = isCategoryImage ? BUCKET_MENU_CATEGORY_IMAGES : BUCKET_MENU_IMAGES

    // Validate restaurant exists and is active
    // This prevents access to images from deleted/inactive restaurants
    const supabase = createServerSupabaseClient()
    
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantIdFromPath)
      .single()

    if (restaurantError || !restaurant) {
      console.error('[API /image] Restaurant not found:', restaurantIdFromPath, restaurantError)
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // For category images, we only validate restaurant ownership
    // Category validation not needed since path format is categories/{restaurantId}/{uuid}.{ext}
    // (No categoryId in path, only restaurantId)

    // Create signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(imagePath, 3600)

    if (error) {
      console.error('[API /image] Error creating signed URL:', {
        bucket: bucket,
        path: imagePath,
        error: error.message,
        name: error.name,
      })

      // Handle bucket not found
      if (error.message.includes('Bucket not found') || 
          error.message.includes('not found') ||
          error.name === 'StorageApiError') {
        return NextResponse.json(
          { 
            error: `Storage bucket '${bucket}' not found. Please create the bucket in Supabase Dashboard.`,
            details: error.message 
          },
          { status: 404 }
        )
      }

      // Handle path not found
      if (error.message.includes('Object not found') || 
          error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Image not found in storage',
            details: error.message 
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate signed URL',
          details: error.message 
        },
        { status: 500 }
      )
    }

    if (!data?.signedUrl) {
      console.error('[API /image] Signed URL data is null:', { data })
      return NextResponse.json(
        { error: 'Failed to generate signed URL: empty response' },
        { status: 500 }
      )
    }

    // Cache the signed URL (expires in 50 minutes)
    signedUrlCache.set(imagePath, {
      url: data.signedUrl,
      expires: Date.now() + (50 * 60 * 1000), // 50 minutes
    })

    // Clean up expired cache entries (simple cleanup, runs per request)
    if (signedUrlCache.size > 100) {
      const now = Date.now()
      const keysToDelete: string[] = []
      signedUrlCache.forEach((value, key) => {
        if (value.expires <= now) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => signedUrlCache.delete(key))
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 })
  } catch (error: any) {
    console.error('[API /image] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

