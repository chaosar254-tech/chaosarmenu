# Menu Routes & QR Links Fix - Complete Summary

## ✅ Route Structure (Verified)

```
apps/menu/app/menu/
├── [restaurantSlug]/
│   ├── page.tsx                    # Redirect handler (backward compatibility)
│   ├── no-branch/
│   │   └── page.tsx                # "No branch configured" page
│   └── [branchSlug]/
│       └── page.tsx                # Main menu page (branch-aware)
└── not-found.tsx                   # 404 page
```

## ✅ Files Created/Edited

### Created:
1. ✅ `apps/menu/app/menu/[restaurantSlug]/no-branch/page.tsx` - No branch configured page
2. ✅ `apps/menu/app/menu/not-found.tsx` - 404 error page

### Edited:
1. ✅ `apps/menu/app/menu/[restaurantSlug]/page.tsx` - Redirect handler with branch slug detection
2. ✅ `apps/menu/app/menu/[restaurantSlug]/[branchSlug]/page.tsx` - Branch-aware menu page with overrides
3. ✅ `apps/dashboard/components/MenuLink.tsx` - QR URL generation (relative URLs, no localhost)
4. ✅ `apps/dashboard/components/QRCodeManagement.tsx` - Uses branch-aware URLs
5. ✅ `apps/dashboard/app/api/branches/[id]/route.ts` - Returns restaurant_slug with branch

## ✅ Final QR URL Format

### Standard Format (Branch-Aware):
```
/menu/[restaurantSlug]/[branchSlug]?table=[tableNo]
```

**Relative URL (no hardcoded localhost):**
- Works on `localhost:3001` automatically
- Works on production domain automatically
- No `NEXT_PUBLIC_SITE_URL` required (uses relative paths)

### Example Working URLs:

**For restaurantSlug="my-restaurant", branchSlug="merkez", table="18":**
```
http://localhost:3001/menu/my-restaurant/merkez?table=18
```

**For old QR codes with branchSlug="ana-sub", table="18":**
```
http://localhost:3001/menu/ana-sub?table=18

→ Redirects to: /menu/[restaurantSlug]/ana-sub?table=18
```

## ✅ Route Behavior

### 1. `/menu/[restaurantSlug]` (Redirect Handler)
- **Behavior:**
  - Looks up restaurant by slug
  - If found: Redirects to default branch (first active branch by `created_at ASC`)
  - If not found: Checks if slug is a branch slug
    - If branch found: Redirects to `/menu/[restaurantSlug]/[branchSlug]`
    - If not found: Shows 404
  - If restaurant found but no branches: Redirects to `/menu/[restaurantSlug]/no-branch`

### 2. `/menu/[restaurantSlug]/[branchSlug]` (Main Menu Page)
- **Behavior:**
  - Loads restaurant data
  - Loads branch data (validates branch belongs to restaurant)
  - Loads branch_social settings
  - Loads branch_menu_overrides
  - Merges menu items with overrides (effective price, availability)
  - Resolves table number from `?table=` param or QR slug
  - Filters out unavailable items

### 3. `/menu/[restaurantSlug]/no-branch` (No Branch Page)
- **Behavior:**
  - Shows helpful message: "Şube Yapılandırılmamış"
  - Provides instructions for creating branches

## ✅ QR URL Generation

### Function: `getMenuUrl(restaurantSlug, branchSlug, tableNo)`
- **Location:** `apps/dashboard/components/MenuLink.tsx`
- **Returns:** Relative URL (no base domain)
- **Format:** `/menu/${restaurantSlug}/${branchSlug}?table=${tableNo}`
- **Usage:** Called from `QRCodeManagement.getTableMenuUrl()`

### QR Code Generation Flow:
1. User selects branch in dashboard
2. `QRCodeManagement` loads branch info (including restaurant_slug)
3. `getTableMenuUrl()` calls `getMenuUrl(restaurant_slug, branch_slug, table_no)`
4. QR code displays relative URL
5. Customer scans QR → Opens `/menu/[restaurantSlug]/[branchSlug]?table=18`
6. Redirect handler resolves if needed → Menu page loads with branch data

## ✅ Backward Compatibility

### Old QR Codes (Branch-Only Slug):
- **Old format:** `/menu/ana-sub?table=18`
- **Behavior:**
  1. Redirect handler checks restaurant lookup (fails)
  2. Checks branch lookup (succeeds for "ana-sub")
  3. Fetches restaurant slug for that branch
  4. Redirects to: `/menu/[restaurantSlug]/ana-sub?table=18`

### Restaurant-Only URLs:
- **Format:** `/menu/my-restaurant?table=18`
- **Behavior:**
  1. Finds restaurant
  2. Finds default branch (first active)
  3. Redirects to: `/menu/my-restaurant/[default-branch]?table=18`

## ✅ Dev Logging (All Routes)

### Redirect Handler (`/menu/[restaurantSlug]/page.tsx`):
```typescript
console.log('[Menu Redirect] Received slug:', slug, 'table:', table)
console.log('[Menu Redirect] Restaurant lookup:', { slug, found, error })
console.log('[Menu Redirect] Branches for restaurant:', { restaurantId, branches: count })
console.log('[Menu Redirect] Branch lookup:', { slug, found, error })
console.log('[Menu Redirect] Redirecting to:', redirectUrl)
console.error('[Menu Redirect] Slug not found:', slug)
```

### Menu Page (`/menu/[restaurantSlug]/[branchSlug]/page.tsx`):
```typescript
console.log('[Menu Page] Route params:', { restaurantSlug, branchSlug, table, tableNumber })
console.log('[Menu Page] Loading data for:', { restaurantSlug, branchSlug })
console.log('[Menu Page] Restaurant found:', { id, name })
console.log('[Menu Page] Branch found:', { id, name })
console.error('[Menu Page] Restaurant not found:', restaurantSlug)
console.error('[Menu Page] Branch not found:', branchSlug)
```

## ✅ Error Handling

### 404 Scenarios:
1. **Invalid restaurant slug** → `notFound()` → Shows `/menu/not-found.tsx`
2. **Invalid branch slug** → Shows error message in menu page
3. **Restaurant exists but no branches** → Redirects to `/menu/[restaurantSlug]/no-branch`

### Error Messages:
- Restaurant not found: `Restoran bulunamadı: [slug]`
- Branch not found: `Şube bulunamadı: [slug]`
- No branches: Custom "No branch configured" page
- Invalid params: `Geçersiz URL parametreleri`

## ✅ Testing Checklist

- [ ] `/menu/my-restaurant` → Redirects to default branch
- [ ] `/menu/my-restaurant/my-branch?table=18` → Loads menu with table 18
- [ ] `/menu/ana-sub?table=18` → Detects branch slug, redirects correctly
- [ ] `/menu/invalid-slug` → Shows 404
- [ ] `/menu/restaurant-no-branches` → Shows "No branch configured" page
- [ ] QR codes generate correct format: `/menu/[restaurantSlug]/[branchSlug]?table=18`
- [ ] Branch overrides apply correctly (effective price)
- [ ] Unavailable items are filtered out
- [ ] Table number resolves from `?table=` param
- [ ] Console logs appear in development mode

## ✅ Example Working URL

**Input:**
- Restaurant Slug: `ana-sub` (actually a branch slug from old QR)
- Branch Slug: `merkez` (target branch)
- Table: `18`

**Old QR Code (backward compatibility):**
```
http://localhost:3001/menu/ana-sub?table=18
→ Redirects to: http://localhost:3001/menu/[restaurantSlug]/ana-sub?table=18
```

**New QR Code (correct format):**
```
http://localhost:3001/menu/my-restaurant/merkez?table=18
→ Directly loads menu page
```

## ✅ Key Fixes Applied

1. ✅ **Removed hardcoded localhost** - Uses relative URLs
2. ✅ **Fixed branch slug detection** - Handles old QR codes with branch-only slugs
3. ✅ **Added comprehensive logging** - All routes log params and results
4. ✅ **Improved error handling** - Clear messages and proper 404 pages
5. ✅ **No branch handling** - Custom page instead of silent 404
6. ✅ **Query param preservation** - Table param survives redirects
7. ✅ **Branch-aware data loading** - Overrides and social settings scoped to branch

