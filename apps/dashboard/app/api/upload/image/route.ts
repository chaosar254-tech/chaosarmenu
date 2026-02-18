import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { BUCKET_MENU_IMAGES } from '@/lib/storage-constants'

export const dynamic = 'force-dynamic'

// Helper function to check if URL is external CDN
function isExternalCDN(url: string | null | undefined): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    // If it's a Supabase URL, it's not external CDN
    if (supabaseUrl && url.includes(supabaseUrl)) {
      return false
    }
    
    // If it's http/https and not Supabase, consider it external CDN
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    // If it's not a valid URL (just a path), it's not external CDN
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    console.log('[Image Upload] Starting upload request')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Image Upload] Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Image Upload] User authenticated:', user.id)

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurant_id') as string
    const menuItemId = formData.get('menu_item_id') as string
    const existingImageUrl = formData.get('image_url') as string | null

    console.log('[Image Upload] Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      restaurantId,
      menuItemId,
      existingImageUrl: existingImageUrl ? 'provided' : null,
    })

    if (!file) {
      console.error('[Image Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!restaurantId) {
      console.error('[Image Upload] Restaurant ID missing')
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    if (!menuItemId) {
      console.error('[Image Upload] Menu item ID missing')
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    // Get restaurant to verify ownership
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('id', restaurantId)
      .eq('owner_user_id', user.id)
      .single()

    if (restaurantError || !restaurant) {
      console.error('[Image Upload] Restaurant verification failed:', {
        restaurantError: restaurantError?.message,
        restaurantId,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Restaurant not found or access denied' },
        { status: 403 }
      )
    }

    console.log('[Image Upload] Restaurant verified:', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name || 'N/A',
      restaurantSlug: restaurant.slug || 'N/A',
    })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate storage path: {restaurantId}/items/{menuItemId}/{uuid}.{ext}
    // Exact format: ${restaurantId}/items/${menuItemId}/${crypto.randomUUID()}.${ext}
    const uuid = randomUUID()
    const extension = file.name.split('.').pop() || 'jpg'
    const storagePath = `${restaurant.id}/items/${menuItemId}/${uuid}.${extension}`

    // Upload to Supabase Storage - using 'images' bucket
    console.log('[Image Upload] Attempting storage upload:', {
      bucket: BUCKET_MENU_IMAGES,
      path: storagePath,
      fileSize: file.size,
    })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_MENU_IMAGES)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Image Upload] Storage upload failed:', {
        bucket: BUCKET_MENU_IMAGES,
        path: storagePath,
        error: uploadError.message,
        errorCode: uploadError.statusCode,
      })
      
      // Handle bucket not found
      if (uploadError.message.includes('Bucket not found') || 
          uploadError.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: `Storage bucket '${BUCKET_MENU_IMAGES}' not found. Please create the bucket in Supabase Dashboard.`,
            bucket: BUCKET_MENU_IMAGES,
            path: storagePath,
          },
          { status: 404 }
        )
      }
      
      // Handle RLS violation
      if (uploadError.message.includes('new row violates row-level security') || 
          uploadError.message.includes('RLS') ||
          uploadError.message.includes('permission denied')) {
        return NextResponse.json(
          { 
            error: 'Upload failed: Permission denied. Please check your restaurant ownership.',
            bucket: BUCKET_MENU_IMAGES,
            path: storagePath,
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: `Upload failed: ${uploadError.message}`,
          bucket: BUCKET_MENU_IMAGES,
          path: storagePath,
        },
        { status: 500 }
      )
    }

    if (!uploadData) {
      console.error('[Image Upload] Upload succeeded but no data returned')
      return NextResponse.json(
        { 
          error: 'Upload succeeded but no data returned',
          bucket: BUCKET_MENU_IMAGES,
          path: storagePath,
        },
        { status: 500 }
      )
    }

    console.log('[Image Upload] Storage upload successful:', {
      path: uploadData.path,
      fullPath: uploadData.fullPath,
    })

    // Generate public CDN URL from Supabase Storage
    let imageUrl = existingImageUrl || null

    // If existing image_url is not an external CDN, generate Supabase CDN URL
    if (!isExternalCDN(existingImageUrl)) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_MENU_IMAGES)
        .getPublicUrl(storagePath)
      
      imageUrl = publicUrlData.publicUrl
      console.log('[Image Upload] Generated Supabase CDN URL:', imageUrl)
    } else {
      console.log('[Image Upload] Using existing external CDN URL:', imageUrl)
    }

    // Return both path and image_url (CDN URL)
    const responseData = {
      path: uploadData.path,
      image_url: imageUrl, // Supabase CDN URL
      message: 'Image uploaded successfully',
    }

    console.log('[Image Upload] Upload complete, returning:', {
      path: responseData.path,
      hasImageUrl: !!responseData.image_url,
    })

    return NextResponse.json(responseData, { status: 200 })
  } catch (error: any) {
    console.error('[Image Upload] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

