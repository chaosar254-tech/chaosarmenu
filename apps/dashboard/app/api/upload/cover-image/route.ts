import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { BUCKET_MENU_LOGOS } from '@/lib/storage-constants'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[Cover Image Upload] Starting upload request')
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Cover Image Upload] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to upload a cover image.' },
        { status: 401 }
      )
    }

    console.log('[Cover Image Upload] User authenticated:', user.id)

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurant_id') as string

    if (!file) {
      console.error('[Cover Image Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!restaurantId) {
      console.error('[Cover Image Upload] No restaurant ID provided')
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    console.log('[Cover Image Upload] Validating restaurant ownership:', {
      restaurantId,
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // Get restaurant to verify ownership
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, owner_user_id, cover_image')
      .eq('id', restaurantId)
      .single()

    if (restaurantError) {
      console.error('[Cover Image Upload] Restaurant query error:', restaurantError)
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    if (!restaurant) {
      console.error('[Cover Image Upload] Restaurant not found:', restaurantId)
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (restaurant.owner_user_id !== user.id) {
      console.error('[Cover Image Upload] Ownership mismatch:', {
        restaurantOwnerId: restaurant.owner_user_id,
        currentUserId: user.id,
        restaurantId,
      })
      return NextResponse.json(
        { 
          error: 'Access denied. You can only upload cover images for restaurants you own.',
          details: 'Restaurant ownership verification failed'
        },
        { status: 403 }
      )
    }

    console.log('[Cover Image Upload] Ownership verified successfully')

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('[Cover Image Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for cover images - larger than logos)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      console.error('[Cover Image Upload] File too large:', file.size)
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 20MB.' },
        { status: 400 }
      )
    }

    // Generate storage path: covers/{restaurantId}/{uuid}.{ext}
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    // Ensure valid extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const finalExtension = validExtensions.includes(extension) ? extension : 'png'
    const uuid = randomUUID()
    const storagePath = `covers/${restaurant.id}/${uuid}.${finalExtension}`

    console.log('[Cover Image Upload] Uploading to storage:', {
      bucket: BUCKET_MENU_LOGOS,
      path: storagePath,
      restaurantId: restaurant.id,
    })

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_MENU_LOGOS)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Cover Image Upload] Storage upload error:', {
        bucket: BUCKET_MENU_LOGOS,
        path: storagePath,
        error: uploadError.message,
        name: uploadError.name,
        restaurantId: restaurant.id,
        userId: user.id,
      })
      
      // Handle bucket not found
      if (uploadError.message.includes('Bucket not found') || 
          uploadError.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: `Storage bucket '${BUCKET_MENU_LOGOS}' not found. Please create the bucket in Supabase Dashboard.`,
            bucket: BUCKET_MENU_LOGOS,
            path: storagePath,
          },
          { status: 404 }
        )
      }
      
      // Handle RLS violation
      if (uploadError.message.includes('new row violates row-level security') || 
          uploadError.message.includes('RLS') ||
          uploadError.message.includes('permission denied') ||
          uploadError.message.includes('violates row-level security policy')) {
        console.error('[Cover Image Upload] RLS violation detected:', {
          path: storagePath,
          restaurantId: restaurant.id,
          userId: user.id,
          ownerUserId: restaurant.owner_user_id,
        })
        return NextResponse.json(
          { 
            error: 'Upload failed: Permission denied. The storage policy may not allow this operation. Please check your restaurant ownership and RLS policies.',
            bucket: BUCKET_MENU_LOGOS,
            path: storagePath,
            details: 'RLS policy violation - ensure the storage policy allows authenticated users to upload to covers/{restaurantId}/ paths for restaurants they own',
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: `Upload failed: ${uploadError.message}`,
          bucket: BUCKET_MENU_LOGOS,
          path: storagePath,
        },
        { status: 500 }
      )
    }

    if (!uploadData) {
      console.error('[Cover Image Upload] Upload succeeded but no data returned')
      return NextResponse.json(
        { error: 'Upload failed: No data returned from storage' },
        { status: 500 }
      )
    }

    console.log('[Cover Image Upload] File uploaded successfully:', {
      path: uploadData.path,
      restaurantId: restaurant.id,
    })

    // Delete old cover image if exists (optional cleanup)
    if (restaurant.cover_image && restaurant.cover_image !== uploadData.path) {
      const oldPathParts = restaurant.cover_image.split('/')
      if (oldPathParts.length >= 3 && oldPathParts[0] === 'covers') {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_MENU_LOGOS)
          .remove([restaurant.cover_image])
        
        if (deleteError) {
          console.warn('[Cover Image Upload] Failed to delete old cover image:', {
            oldPath: restaurant.cover_image,
            error: deleteError.message,
          })
        } else {
          console.log('[Cover Image Upload] Old cover image deleted:', restaurant.cover_image)
        }
      }
    }

    // Update restaurants table with cover_image
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ cover_image: uploadData.path })
      .eq('id', restaurant.id)

    if (updateError) {
      console.error('[Cover Image Upload] Error updating cover_image in database:', updateError)
      // Try to delete the uploaded file since DB update failed
      await supabase.storage
        .from(BUCKET_MENU_LOGOS)
        .remove([uploadData.path])
      
      return NextResponse.json(
        { 
          error: 'Upload succeeded but failed to update database. The file was removed.',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    console.log('[Cover Image Upload] Database updated successfully:', {
      restaurantId: restaurant.id,
      coverImagePath: uploadData.path,
    })

    // Return the storage path
    return NextResponse.json(
      { 
        path: uploadData.path,
        message: 'Cover image uploaded successfully' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Cover Image Upload] Unexpected error:', {
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
