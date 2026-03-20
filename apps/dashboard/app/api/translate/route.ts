import { NextRequest, NextResponse } from 'next/server'

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPL_API_KEY tanımlı değil' }, { status: 500 })
  }

  const { texts, targetLang } = await req.json()
  if (!texts || !targetLang) {
    return NextResponse.json({ error: 'texts ve targetLang gerekli' }, { status: 400 })
  }

  const params = new URLSearchParams()
  params.append('source_lang', 'TR')
  params.append('target_lang', targetLang)
  for (const text of texts) {
    params.append('text', text || '')
  }

  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `DeepL hatası: ${err}` }, { status: res.status })
  }

  const data = await res.json()
  const translations = data.translations.map((t: { text: string }) => t.text)
  return NextResponse.json({ translations })
}
