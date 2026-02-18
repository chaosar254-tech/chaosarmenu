import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/demo-request
 * Create a demo request from DemoLimitModal
 * Uses service role to bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, restaurantName } = body

    if (!name || !email || !phone || !restaurantName) {
      return NextResponse.json(
        { error: 'name, email, phone, and restaurantName are required' },
        { status: 400 }
      )
    }

    // Pre-check: Service Role Key must be present
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: Service Role Key is missing!')
      console.error('[Demo Request API] Environment check:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      })
      return NextResponse.json(
        { error: 'Server Config Error' },
        { status: 500 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('[Demo Request API] Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      )
    }

    // Create admin client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Insert demo request into applications table with type='demo_request'
    // If type column doesn't exist, try without it (fallback)
    try {
      const { data: demoRequest, error: insertError } = await supabase
        .from('applications')
        .insert({
          business_name: restaurantName,
          full_name: name,
          contact_email: email,
          contact_phone: phone,
          status: 'pending',
          type: 'demo_request', // Tag as demo request
        })
        .select()
        .single()

      if (insertError) {
        // Log the exact error for debugging
        console.error('FULL API ERROR (Supabase):', JSON.stringify(insertError, null, 2))
        console.error('[Demo Request API] Supabase Error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: JSON.stringify(insertError, null, 2),
        })

        // Check if error is due to missing type column
        const errorMessage = insertError.message?.toLowerCase() || ''
        const errorDetails = insertError.details?.toLowerCase() || ''
        const errorHint = insertError.hint?.toLowerCase() || ''
        
        const isTypeColumnError = 
          errorMessage.includes('column') && errorMessage.includes('type') ||
          errorDetails.includes('column') && errorDetails.includes('type') ||
          errorHint.includes('column') && errorHint.includes('type') ||
          insertError.code === 'PGRST116' || // PostgREST error code for column not found
          errorMessage.includes('does not exist')

        if (isTypeColumnError) {
          console.warn('[Demo Request API] Type column not found, inserting without type')
          const { data: demoRequestFallback, error: insertErrorFallback } = await supabase
            .from('applications')
            .insert({
              business_name: restaurantName,
              full_name: name,
              contact_email: email,
              contact_phone: phone,
              status: 'pending',
            })
            .select()
            .single()

          if (insertErrorFallback) {
            console.error('FULL API ERROR (fallback):', JSON.stringify(insertErrorFallback, null, 2))
            console.error('[Demo Request API] Supabase Error (fallback):', {
              message: insertErrorFallback.message,
              details: insertErrorFallback.details,
              hint: insertErrorFallback.hint,
              code: insertErrorFallback.code,
              fullError: JSON.stringify(insertErrorFallback, null, 2),
            })
            return NextResponse.json(
              { 
                error: 'Failed to create demo request',
                details: insertErrorFallback.message || 'Unknown Supabase error',
                supabaseDetails: insertErrorFallback.details,
                supabaseHint: insertErrorFallback.hint,
                supabaseCode: insertErrorFallback.code,
                debugEnv: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key Exists' : 'Key MISSING',
                fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(insertErrorFallback, null, 2) : undefined,
              },
              { status: 500 }
            )
          }

          if (!demoRequestFallback) {
            console.error('[Demo Request API] Fallback insert returned null data')
            return NextResponse.json(
              { 
                error: 'Failed to create demo request',
                details: 'Insert succeeded but no data returned',
              },
              { status: 500 }
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Demo request created successfully (without type column)',
            data: demoRequestFallback,
            warning: 'Type column not found. Request saved but may appear in regular applications list.',
          })
        }

        console.error('[Demo Request API] Supabase Error (non-type-column):', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: JSON.stringify(insertError, null, 2),
        })
        return NextResponse.json(
          { 
            error: 'Failed to create demo request',
            details: insertError.message || 'Unknown Supabase error',
            supabaseDetails: insertError.details,
            supabaseHint: insertError.hint,
            supabaseCode: insertError.code,
            debugEnv: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key Exists' : 'Key MISSING',
            fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(insertError, null, 2) : undefined,
          },
          { status: 500 }
        )
      }

      // Check if demoRequest is null before using it
      if (!demoRequest) {
        console.error('[Demo Request API] Insert succeeded but returned null data')
        return NextResponse.json(
          { 
            error: 'Failed to create demo request',
            details: 'Insert succeeded but no data returned',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Demo request created successfully',
        data: demoRequest,
      })
    } catch (insertException: any) {
      // Catch any unexpected errors during insert
      console.error('FULL API ERROR (insert):', JSON.stringify(insertException, null, 2))
      console.error('[Demo Request API] Unexpected error during insert:', {
        message: insertException?.message,
        stack: insertException?.stack,
        name: insertException?.name,
        cause: insertException?.cause,
        fullError: JSON.stringify(insertException, Object.getOwnPropertyNames(insertException), 2),
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to create demo request',
          details: insertException instanceof Error ? insertException.message : String(insertException),
          debugEnv: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key Exists' : 'Key MISSING',
          fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(insertException, Object.getOwnPropertyNames(insertException), 2) : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('FULL API ERROR:', JSON.stringify(error, null, 2))
    console.error('Demo Request Failed:', error)
    console.error('[Demo Request API] Unexpected error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    })
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
        debugEnv: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key Exists' : 'Key MISSING',
        fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : undefined,
      },
      { status: 500 }
    )
  }
}
