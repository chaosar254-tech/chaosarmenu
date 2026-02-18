import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Proxies USDZ files from Supabase so the AR link is same-origin.
 * iOS Safari shows "Bu 3B model açılsın mı?" and opens Quick Look when the
 * link is same-origin; cross-origin (Supabase URL) often opens in-browser.
 */
export async function GET(request: NextRequest) {
  try {
    const urlParam = request.nextUrl.searchParams.get('url')
    if (!urlParam) {
      return NextResponse.json({ error: 'url parameter required' }, { status: 400 })
    }

    let targetUrl: URL
    try {
      targetUrl = new URL(decodeURIComponent(urlParam))
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }

    if (targetUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only https URLs allowed' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const allowedOrigin = new URL(supabaseUrl).origin
    if (targetUrl.origin !== allowedOrigin) {
      return NextResponse.json({ error: 'URL must be from Supabase storage' }, { status: 400 })
    }

    const res = await fetch(targetUrl.toString(), {
      headers: { Accept: '*/*' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch model', status: res.status },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const contentType = res.headers.get('content-type') || 'model/vnd.usdz+zip'
    const contentLength = res.headers.get('content-length')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    if (contentLength) headers.set('Content-Length', contentLength)
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(res.body, {
      status: 200,
      headers,
    })
  } catch (err: unknown) {
    console.error('[api/ar-model]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
