import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// Bucket name must be EXACTLY: menu_category_images
const BUCKET_NAME = 'menu_category_images'

export async function POST(request: NextRequest) {
  try {
    // 1) Read session user via auth helpers (cookies). If no session -> 401.
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Called from a Server Component, can be ignored
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Called from a Server Component, can be ignored
            }
          },
        },
      }
    )

    // Validate: user session exists (401 if not)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authUid = user?.id || null // authenticated user id from session
    
    if (authError || !user) {
      console.error('[Category Image Upload] Auth failed:', {
        authUid: null,
        authError: authError?.message,
      })
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('category_id') as string | null
    const restaurantIdFromRequest = formData.get('restaurant_id') as string | null

    // 2) Resolve restaurantId from request and query public.restaurants:
    //    - ensure restaurants.id == restaurantId
    //    - ensure restaurants.owner_user_id == session.user.id
    //    - if not -> 403
    if (!restaurantIdFromRequest) {
      return NextResponse.json(
        { ok: false, error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, owner_user_id')
      .eq('id', restaurantIdFromRequest)
      .eq('owner_user_id', authUid)
      .single()

    if (restaurantError || !restaurant) {
      console.error('[Category Image Upload] Restaurant ownership check failed:', {
        authUid,
        restaurantIdFromRequest,
        restaurantError: restaurantError?.message,
      })
      return NextResponse.json(
        { ok: false, error: 'Restaurant not found or access denied' },
        { status: 403 }
      )
    }

    const restaurantId = restaurant.id

    // Validate: file exists in formData (400 if not)
    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate: categoryId exists (400 if not)
    if (!categoryId) {
      return NextResponse.json(
        { ok: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Verify category belongs to this restaurant
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, restaurant_id')
      .eq('id', categoryId)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { ok: false, error: 'Category not found or does not belong to your restaurant' },
        { status: 404 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Get extension from filename or mime type
    let ext = 'jpg' // default
    if (file.name && file.name.includes('.')) {
      ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    } else if (file.type) {
      // Fallback to mime type
      if (file.type === 'image/png') ext = 'png'
      else if (file.type === 'image/webp') ext = 'webp'
      else if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg'
    }
    
    // Ensure extension is valid
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      ext = 'jpg'
    }

    // 3) Perform storage upload with supabaseAdmin (service role key) into bucket "menu_category_images"
    //    at: categories/{restaurantId}/{uuid}.{ext}
    const fileUuid = randomUUID()
    const objectPath = `categories/${restaurantId}/${fileUuid}.${ext}`
    const bucketName = BUCKET_NAME

    // Diagnostic logging: authUid, restaurantId, restaurant.owner_user_id, objectPath
    console.log('[Category Image Upload] Diagnostic info:', {
      authUid: authUid,
      restaurantId: restaurantId,
      'restaurant.owner_user_id': restaurant.owner_user_id,
      objectPath: objectPath,
      bucket: bucketName,
      ownershipMatch: authUid === restaurant.owner_user_id,
      pathFormatCorrect: objectPath.startsWith(`categories/${restaurantId}/`),
    })

    const isDev = process.env.NODE_ENV === 'development'

    // Create admin client for storage upload (bypasses RLS)
    const supabaseAdmin = createSupabaseAdminClient()

    // Upload to bucket "menu_category_images" using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Category Image Upload] Storage upload failed:', {
        authUid: authUid,
        restaurantId: restaurantId,
        'restaurant.owner_user_id': restaurant.owner_user_id,
        objectPath: objectPath,
        bucket: bucketName,
        ownershipMatch: authUid === restaurant.owner_user_id,
        pathFormatCorrect: objectPath.startsWith(`categories/${restaurantId}/`),
        categoryId: categoryId,
        supabaseError: uploadError,
      })

      const errorMessage = uploadError.message || String(uploadError)
      const errorResponse: any = {
        ok: false,
        error: errorMessage,
        code: (uploadError as any).statusCode || (uploadError as any).status || null,
        path: objectPath,
        bucket: bucketName,
      }

      // Add debug info in dev
      if (isDev) {
        errorResponse.authUid = authUid
        errorResponse.restaurantId = restaurantId
        errorResponse['restaurant.owner_user_id'] = restaurant.owner_user_id
        errorResponse.objectPath = objectPath
        errorResponse.ownershipMatch = authUid === restaurant.owner_user_id
        errorResponse.pathFormatCorrect = objectPath.startsWith(`categories/${restaurantId}/`)
      }

      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Update menu_categories.image_url with the storage path
    const { error: updateError } = await supabase
      .from('menu_categories')
      .update({ image_url: objectPath })
      .eq('id', categoryId)
      .eq('restaurant_id', restaurant.id)

    if (updateError) {
      console.error('[Category Image Upload] Failed to update category:', {
        bucket: bucketName,
        objectPath: objectPath,
        restaurantId: restaurantId,
        authUid: authUid,
        categoryId: categoryId,
        error: updateError.message,
      })
      
      // Try to delete uploaded file on failure using admin client
      try {
        await supabaseAdmin.storage
          .from(bucketName)
          .remove([objectPath])
      } catch (deleteError) {
        console.error('[Category Image Upload] Failed to delete uploaded file:', deleteError)
      }

      const errorResponse: any = {
        ok: false,
        error: 'Failed to update category. Image uploaded but database update failed.',
      }

      // Add debug info in dev
      if (isDev) {
        errorResponse.authUid = authUid
        errorResponse.restaurantId = restaurantId
        errorResponse['restaurant.owner_user_id'] = restaurant.owner_user_id
        errorResponse.objectPath = objectPath
        errorResponse.bucket = bucketName
        errorResponse.categoryId = categoryId
        errorResponse.databaseError = updateError.message
      }

      return NextResponse.json(errorResponse, { status: 500 })
    }

    // 4) Return JSON { ok:true, path, publicUrl or signedUrl }
    // Generate public URL (since bucket is private, we'd need signed URL for actual access)
    // For now, return path - client can use /api/image to get signed URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(objectPath)

    console.log('[Category Image Upload] Upload successful:', {
      bucket: bucketName,
      objectPath: objectPath,
      restaurantId: restaurantId,
      authUid: authUid,
      categoryId: categoryId,
    })

    // Return JSON including the path and publicUrl
    return NextResponse.json(
      { 
        ok: true,
        path: objectPath,
        publicUrl: publicUrlData.publicUrl,
        message: 'Category image uploaded successfully' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    const isDev = process.env.NODE_ENV === 'development'
    const errorMessage = error?.message || 'Internal server error'
    const errorStack = error?.stack
    const errorName = error?.name
    
    console.error('[Category Image Upload] Unexpected error:', {
      errorMessage,
      errorStack,
      errorName,
    })
    
    // Ensure response always returns JSON with detailed error in dev
    return NextResponse.json(
      { 
        ok: false,
        error: errorMessage,
        ...(isDev && {
          stack: errorStack,
          name: errorName,
          fullError: String(error),
        }),
      },
      { status: 500 }
    )
  }
}

