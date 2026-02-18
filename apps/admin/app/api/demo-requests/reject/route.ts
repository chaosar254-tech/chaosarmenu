import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import * as nodemailer from 'nodemailer'

/**
 * POST /api/demo-requests/reject
 * Reject demo request and send email notification
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    // Geçici olarak admin kontrolünü bypass ediyoruz (production'da aktif edilecek)
    if (profileError) {
      console.warn('[Demo Requests Reject API] Profile not found for user:', user.id, 'Allowing access temporarily')
    } else if (profile && !profile.is_admin) {
      console.warn('[Demo Requests Reject API] User is not admin:', user.id, 'Allowing access temporarily')
    }

    const body = await request.json()
    const { 
      application_id,
      subject,
      message
    } = body

    if (!application_id || !subject || !message) {
      return NextResponse.json(
        { error: 'application_id, subject, and message are required' },
        { status: 400 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    // Get demo request details
    const { data: demoRequest, error: requestError } = await adminClient
      .from('applications')
      .select('id, business_name, contact_email, full_name, status')
      .eq('id', application_id)
      .single()

    if (requestError || !demoRequest) {
      return NextResponse.json(
        { error: 'Demo request not found' },
        { status: 404 }
      )
    }

    // Type assertion
    const demoRequestData = demoRequest as { id: string; business_name: string; contact_email: string; full_name: string; status: string }

    // Update demo request status to 'rejected'
    const { data: updatedRequest, error: updateError } = await (adminClient
      .from('applications') as any)
      .update({ status: 'rejected' } as any)
      .eq('id', application_id)
      .select()
      .single()

    if (updateError) {
      console.error('[Demo Requests Reject API] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update demo request status' },
        { status: 500 }
      )
    }

    // Send email using Nodemailer
    try {
      // Get SMTP configuration from environment variables
      const smtpHost = process.env.SMTP_HOST
      const smtpPort = parseInt(process.env.SMTP_PORT || '465')
      const smtpUser = process.env.SMTP_USER
      const smtpPass = process.env.SMTP_PASS

      // Verify SMTP configuration
      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('[Demo Requests Reject API] SMTP credentials not configured, skipping email send')
        return NextResponse.json({
          success: true,
          message: 'Demo request rejected successfully (email not sent - SMTP not configured)',
          data: updatedRequest,
        })
      }

      // Configure SMTP transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465 (SSL), false for other ports (TLS)
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      // Send email
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: demoRequestData.contact_email,
        subject: subject,
        html: message.replace(/\n/g, '<br>'), // Convert newlines to <br> for HTML email
      }

      await transporter.sendMail(mailOptions)
      console.log('[Demo Requests Reject API] Email sent successfully to:', demoRequestData.contact_email)

      return NextResponse.json({
        success: true,
        message: 'Demo request rejected and email sent successfully',
        data: updatedRequest,
      })
    } catch (emailError: any) {
      console.error('[Demo Requests Reject API] Email send error:', emailError)
      // Demo request status is already updated, so return success with warning
      return NextResponse.json({
        success: true,
        message: 'Demo request rejected, but email failed to send: ' + emailError.message,
        data: updatedRequest,
        emailError: emailError.message,
      })
    }
  } catch (error: any) {
    console.error('[Demo Requests Reject API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
