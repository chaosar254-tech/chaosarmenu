# QR URL Absolute URL Fix - Complete Implementation

## ✅ Files Changed

### 1. `apps/dashboard/components/MenuLink.tsx`
- ✅ Added `getBaseUrl()` helper function
- ✅ Added `buildMenuUrl()` function (absolute URLs)
- ✅ Updated `MenuLink` component to use `buildMenuUrl()`
- ✅ Added smart port fix for localhost (3000 → 3001)
- ✅ Added console warnings if NEXT_PUBLIC_SITE_URL not set

### 2. `apps/dashboard/components/QRCodeManagement.tsx`
- ✅ Updated import to use `buildMenuUrl`
- ✅ Updated `getTableMenuUrl()` to return absolute URL
- ✅ QR code `value` prop now receives absolute URL
- ✅ Added debug URL display box under each QR code
- ✅ Updated preview URL in modal to show absolute format

## ✅ Final QR URL Format

### Absolute URL Pattern:
```
${baseUrl}/menu/${restaurantSlug}/${branchSlug}?table=${encodeURIComponent(tableNo)}
```

### Base URL Resolution:
1. **Priority 1:** `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash)
2. **Priority 2 (dev only):** Smart port fix - if `window.location.origin` contains `:3000`, replace with `:3001`
3. **Priority 3:** `window.location.origin` (fallback - will show warning in dev)

## ✅ Example Working URL

**Input:**
- Restaurant Slug: `chaos-burger`
- Branch Slug: `kadikoy-sube`
- Table: `8`
- Base URL: `http://localhost:3001` (from NEXT_PUBLIC_SITE_URL)

**Output:**
```
http://localhost:3001/menu/chaos-burger/kadikoy-sube?table=8
```

## ✅ Environment Variable Setup

### Required in `apps/dashboard/.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### For Production:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Note:** Trailing slash is automatically trimmed. Variable is required for correct port (menu app runs on 3001, dashboard on 3000).

## ✅ UI Changes

### QR Code Display:
- **QR Image:** Uses absolute URL as value
- **Debug Box:** Shows full absolute URL under QR code (monospace font)
- **QR Slug:** Still displayed for reference
- **Link Kopyala Button:** Copies absolute URL to clipboard

### MenuLink Component:
- **Input Field:** Shows absolute URL (monospace, smaller font)
- **Copy Button:** Copies absolute URL
- **Helper Text:** Indicates "Absolute URL"

## ✅ Smart Port Detection (Dev Only)

If `NEXT_PUBLIC_SITE_URL` is not set in development:
- Detects if `window.location.origin` contains `:3000` (dashboard port)
- Automatically replaces with `:3001` (menu port)
- Shows console warning to set env variable properly

## ✅ Code Snippets

### buildMenuUrl Function:
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

### QR Code Generation:
```typescript
const getTableMenuUrl = (table: Table): string => {
  if (!branchInfo) return ''
  return buildMenuUrl(branchInfo.restaurant_slug, branchInfo.slug, table.table_no)
}
```

### Usage in Component:
```typescript
const menuUrl = getTableMenuUrl(table) // Returns: http://localhost:3001/menu/chaos-burger/kadikoy-sube?table=8
<QRCodeSVG value={menuUrl} /> // QR code contains absolute URL
```

## ✅ Testing Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL=http://localhost:3001` in `.env.local`
- [ ] Restart dashboard app (port 3000)
- [ ] Navigate to QR codes page
- [ ] Verify QR codes show absolute URLs starting with `http://localhost:3001`
- [ ] Verify debug box displays full URL under each QR
- [ ] Verify "Link Kopyala" button copies absolute URL
- [ ] Scan QR code - should open menu on correct port (3001)
- [ ] Verify MenuLink component shows absolute URL
- [ ] Test without NEXT_PUBLIC_SITE_URL - should auto-fix port in dev

## ✅ Important Notes

1. **Dashboard runs on 3000, Menu runs on 3001** - Always set NEXT_PUBLIC_SITE_URL to menu app URL
2. **Port auto-fix is dev-only** - Always set env variable in production
3. **Table parameter is URL-encoded** - Handles special characters correctly
4. **Trailing slash is trimmed** - Prevents double slashes

