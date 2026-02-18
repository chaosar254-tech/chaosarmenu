/**
 * Same-origin AR link for iOS (fallback when blob open not used).
 */
export function getARLinkForIOS(usdzUrl: string): string {
  if (typeof window === 'undefined') return usdzUrl
  if (usdzUrl.includes('supabase.co')) {
    return `${window.location.origin}/ar/model.usdz?url=${encodeURIComponent(usdzUrl)}`
  }
  return usdzUrl
}

/**
 * Opens AR Quick Look via blob URL so Safari never navigates to the white 3D page.
 * Fetches USDZ from our proxy, creates blob URL, triggers <a rel="ar"> click →
 * native "Bu 3B model açılsın mı?" + Quick Look. Call only from user gesture (e.g. button click).
 */
export async function openARWithBlob(
  usdzUrl: string,
  posterUrl?: string | null
): Promise<void> {
  if (typeof window === 'undefined') return
  const proxyUrl = getARLinkForIOS(usdzUrl)
  try {
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.rel = 'ar'
    a.href = blobUrl
    if (posterUrl) {
      const img = document.createElement('img')
      img.src = posterUrl
      img.alt = ''
      a.appendChild(img)
    }
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('[AR] openARWithBlob failed:', err)
    // Fallback: open link in same tab (user may still see white page once)
    window.location.href = proxyUrl
  }
}
