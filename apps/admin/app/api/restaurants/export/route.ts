export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'

// Hardcode Supabase Admin Client (Service Role Key)
const SUPABASE_URL = "https://kenrjnphvocixvbbvwvy.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_yJn8IqcaYnf9gJAZXshjqg_rUygjxTL"

const createSupabaseAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const adminClient = createSupabaseAdminClient()
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv' // csv or pdf

    // Get all restaurants
    const { data: restaurants, error } = await adminClient
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurants:', error)
      return NextResponse.json(
        { error: 'Veriler yüklenemedi' },
        { status: 500 }
      )
    }

    // Get owner emails
    const restaurantsWithEmails = await Promise.all(
      (restaurants || []).map(async (restaurant) => {
        try {
          const { data: ownerData } = await adminClient.auth.admin.getUserById(
            restaurant.owner_user_id
          )
          return {
            ...restaurant,
            owner_email: ownerData?.user?.email || 'N/A',
          }
        } catch {
          return {
            ...restaurant,
            owner_email: 'N/A',
          }
        }
      })
    )

    if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Kayıtlı Restoranlar Listesi', 14, 20)
      
      // Date
      doc.setFontSize(10)
      doc.text(
        `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
        14,
        30
      )

      // Table headers
      doc.setFontSize(10)
      let yPos = 40
      doc.text('İşletme Adı', 14, yPos)
      doc.text('Email', 60, yPos)
      doc.text('Plan', 120, yPos)
      doc.text('Durum', 150, yPos)
      doc.text('Kayıt Tarihi', 170, yPos)

      yPos += 5
      doc.line(14, yPos, 200, yPos)

      // Table rows
      yPos += 7
      restaurantsWithEmails.forEach((restaurant) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(9)
        doc.text(restaurant.name || 'N/A', 14, yPos)
        doc.text(restaurant.owner_email || 'N/A', 60, yPos)
        
        const plan = restaurant.plan === 'starter' ? 'Başlangıç' 
          : restaurant.plan === 'standard' ? 'Standart' 
          : restaurant.plan === 'premium' ? 'Premium' 
          : 'Başlangıç'
        doc.text(plan, 120, yPos)
        
        doc.text(
          restaurant.is_active !== false ? 'Aktif' : 'Pasif',
          150,
          yPos
        )
        
        doc.text(
          new Date(restaurant.created_at).toLocaleDateString('tr-TR'),
          170,
          yPos
        )

        yPos += 7
      })

      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="restoranlar-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    } else {
      // Generate CSV
      const headers = [
        'İşletme Adı',
        'Email',
        'Slug',
        'Plan',
        'Durum',
        'Kayıt Tarihi',
      ]

      const csvRows = [
        headers.join(','),
        ...restaurantsWithEmails.map((r) => {
          const plan = r.plan === 'starter' ? 'Başlangıç' 
            : r.plan === 'standard' ? 'Standart' 
            : r.plan === 'premium' ? 'Premium' 
            : 'Başlangıç'
          return [
            `"${r.name || ''}"`,
            `"${r.owner_email || ''}"`,
            `"${r.slug || ''}"`,
            `"${plan}"`,
            `"${r.is_active !== false ? 'Aktif' : 'Pasif'}"`,
            `"${new Date(r.created_at).toLocaleDateString('tr-TR')}"`,
          ].join(',')
        }),
      ]

      const csv = csvRows.join('\n')
      const csvBuffer = Buffer.from('\uFEFF' + csv, 'utf-8') // BOM for Excel

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="restoranlar-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: error.message || 'Export başarısız' },
      { status: 500 }
    )
  }
}
