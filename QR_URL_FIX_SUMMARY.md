# QR URL Absolute URL Fix - Summary

## ✅ Changes Applied

### 1. **Updated MenuLink.tsx** (`apps/dashboard/components/MenuLink.tsx`)

**Added `buildMenuUrl()` function:**
```typescript
export function buildMenuUrl(restaurantSlug: string, branchSlug: string, table?: number | string | null): string {
  const baseUrl = getBaseUrl()
  let url = `${baseUrl}/menu/${restaurantSlug}/${branchSlug}`
  if (table) {
    url += `?table=${encodeURIComponent(table)}`
  }
  return url
}
```

**Base URL resolution:**
- Uses `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash)
- Falls back to `window.location.origin` on client (not ideal - env should be set)
- For localhost dev: should be `http://localhost:3001`

**Updated MenuLink component:**
- Uses `buildMenuUrl()` instead of `getMenuUrl()`
- Displays absolute URL in input field
- Copy button copies absolute URL

### 2. **Updated QRCodeManagement.tsx** (`apps/dashboard/components/QRCodeManagement.tsx`)

**Updated `getTableMenuUrl()`:**
- Now uses `buildMenuUrl()` for absolute URLs
- QR code `value` prop receives absolute URL
- `handleCopyLink()` copies absolute URL

**UI Updates:**
- Added debug display box showing full absolute URL under each QR
- URL displayed in monospace font for readability
- Preview URL in modal also shows absolute format

### 3. **Files Changed**

1. ✅ `apps/dashboard/components/MenuLink.tsx`
   - Added `getBaseUrl()` helper
   - Added `buildMenuUrl()` function (absolute URLs)
   - Updated `MenuLink` component to use absolute URLs
   - Kept `getMenuUrl()` for relative URLs (internal use)

2. ✅ `apps/dashboard/components/QRCodeManagement.tsx`
   - Updated import to use `buildMenuUrl`
   - Updated `getTableMenuUrl()` to return absolute URL
   - Added debug URL display under each QR code
   - Updated preview URL in modal

## ✅ Environment Variable Setup

**Required in `apps/dashboard/.env.local`:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**For production:**
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Note:** Trailing slash is automatically trimmed.

## ✅ Final QR URL Format

### Absolute URL Format:
```
${baseUrl}/menu/${restaurantSlug}/${branchSlug}?table=${tableNo}
```

### Example Working URL:

**Input:**
- Base URL: `http://localhost:3001` (from NEXT_PUBLIC_SITE_URL)
- Restaurant Slug: `chaos-burger`
- Branch Slug: `kadikoy-sube`
- Table: `8`

**Output:**
```
http://localhost:3001/menu/chaos-burger/kadikoy-sube?table=8
```

## ✅ UI Changes

### QR Code Display:
- **Before:** Only QR image and table number
- **After:** QR image + full absolute URL displayed in debug box + "Link Kopyala" button

### MenuLink Component:
- **Before:** Relative URL displayed
- **After:** Absolute URL displayed with monospace font

### Preview in Modal:
- Shows absolute URL format with placeholder (XX)

## ✅ Testing

1. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3001` in `.env.local`
2. Restart dashboard app
3. Navigate to QR codes page
4. Verify QR codes show absolute URLs starting with `http://localhost:3001`
5. Verify "Link Kopyala" copies absolute URL
6. Verify QR code value is absolute URL (scan QR to verify)

## ✅ Important Notes

- **Dashboard runs on port 3000, Menu runs on port 3001**
- **NEXT_PUBLIC_SITE_URL should point to menu app (3001)**
- **Fallback to `window.location.origin` is not ideal** - will use dashboard port (3000) if env not set
- **Always set NEXT_PUBLIC_SITE_URL in production** to avoid wrong port/domain issues

