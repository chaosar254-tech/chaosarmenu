import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { BUCKET_MENU_IMAGES } from '@/lib/storage-constants'

// This endpoint is public and creates signed URLs for menu images
// Uses service role key to bypass RLS for public menu access
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing service role key. SUPABASE_SERVICE_ROLE_KEY must be set.' },
        { status: 500 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { paths } = body

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of paths.' },
        { status: 400 }
      )
    }

    // Memoize signed URLs per request (cache in memory for this request)
    const signedUrls: Record<string, string> = {}
    
    // Generate signed URLs for all paths
    for (const path of paths) {
      if (!path || typeof path !== 'string') continue

      try {
        // Create signed URL valid for 1 hour (3600 seconds)
        const { data, error } = await supabase.storage
          .from(BUCKET_MENU_IMAGES)
          .createSignedUrl(path, 3600)

        if (error) {
          console.error('Error creating signed URL:', {
            bucket: BUCKET_MENU_IMAGES,
            path,
            error: error.message,
          })
          
          // Handle bucket not found
          if (error.message.includes('Bucket not found') || 
              error.message.includes('not found')) {
            console.error(`Bucket '${BUCKET_MENU_IMAGES}' not found. Please create it in Supabase Dashboard.`)
          }
          
          // Continue with other paths even if one fails
          continue
        }

        if (data?.signedUrl) {
          signedUrls[path] = data.signedUrl
        }
      } catch (error) {
        console.error(`Exception creating signed URL for ${path}:`, error)
        // Continue with other paths
        continue
      }
    }

    return NextResponse.json({ signedUrls }, { status: 200 })
  } catch (error: any) {
    console.error('Signed URL generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

