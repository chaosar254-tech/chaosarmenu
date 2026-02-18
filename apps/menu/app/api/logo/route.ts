import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic';

const BUCKET_MENU_LOGOS = 'menu_logos' as const

// This endpoint generates signed URLs for restaurant logos
// Uses service role key to bypass RLS for public menu access
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('[API /logo] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      console.error('[API /logo] Missing SUPABASE_SERVICE_ROLE_KEY')
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
    let logoPath: string
    try {
      logoPath = decodeURIComponent(encodedPath)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid path encoding' },
        { status: 400 }
      )
    }

    // Validate path: must not be empty, must not contain "..", must be simple path
    if (!logoPath || logoPath.includes('..') || logoPath.includes('/') === false) {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 }
      )
    }

    // Validate path format: should be logos/{restaurantId}/{uuid}.{ext}
    const pathPattern = /^logos\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i
    if (!pathPattern.test(logoPath)) {
      console.error('[API /logo] Invalid path format:', logoPath)
      return NextResponse.json(
        { error: 'Invalid path format. Expected: logos/{restaurantId}/{uuid}.{ext}' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createServerSupabaseClient()

    // Create signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from(BUCKET_MENU_LOGOS)
      .createSignedUrl(logoPath, 3600)

    if (error) {
      console.error('[API /logo] Error creating signed URL:', {
        bucket: BUCKET_MENU_LOGOS,
        path: logoPath,
        error: error.message,
        name: error.name,
      })

      // Handle bucket not found
      if (error.message.includes('Bucket not found') || 
          error.message.includes('not found') ||
          error.name === 'StorageApiError') {
        return NextResponse.json(
          { 
            error: `Storage bucket '${BUCKET_MENU_LOGOS}' not found. Please create the bucket in Supabase Dashboard.`,
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
            error: 'Logo not found in storage',
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
      console.error('[API /logo] Signed URL data is null:', { data })
      return NextResponse.json(
        { error: 'Failed to generate signed URL: empty response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 })
  } catch (error: any) {
    console.error('[API /logo] Unexpected error:', {
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

