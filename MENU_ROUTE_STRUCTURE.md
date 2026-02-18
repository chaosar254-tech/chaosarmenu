# Menu Route Structure & QR URL Format

## Route Structure

### ✅ Current Routes (Next.js App Router)

```
apps/menu/app/menu/
├── [restaurantSlug]/
│   ├── page.tsx                    # Redirect handler (backward compatibility)
│   └── [branchSlug]/
│       └── page.tsx                # Actual menu page (branch-aware)
└── not-found.tsx                   # 404 page
```

### Route Behavior

1. **`/menu/[restaurantSlug]`** → Redirects to default branch
   - Example: `/menu/my-restaurant` → `/menu/my-restaurant/default-branch`
   - If restaurant not found, checks if slug is a branch slug
   - If branch found, redirects to `/menu/[restaurantSlug]/[branchSlug]`
   - If neither found, shows 404

2. **`/menu/[restaurantSlug]/[branchSlug]`** → Main menu page
   - Example: `/menu/my-restaurant/my-branch?table=18`
   - Loads branch-specific data (overrides, social settings)
   - Resolves table number from `?table=` param or QR slug

3. **`/menu/not-found`** → 404 error page

## QR URL Format

### ✅ Correct Format (Branch-Aware)

```
/menu/[restaurantSlug]/[branchSlug]?table=[table_no]
```

**Example:**
```
https://yourdomain.com/menu/my-restaurant/my-branch?table=18
```

### QR Generation (Dashboard)

**Function:** `getMenuUrl(restaurantSlug, branchSlug, tableNo)`
- Location: `apps/dashboard/components/MenuLink.tsx`
- Base URL: `process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin`
- No hardcoded localhost

**QR Code Management:**
- Location: `apps/dashboard/components/QRCodeManagement.tsx`
- Uses `getTableMenuUrl()` which calls `getMenuUrl()`
- Requires active branch to generate URL

## Backward Compatibility

### Legacy URLs (Redirected)

1. **Restaurant-only:** `/menu/[restaurantSlug]?table=18`
   - Redirects to: `/menu/[restaurantSlug]/[default-branch]?table=18`
   - Default branch = first active branch (by `created_at ASC`)

2. **Branch-only (old QR codes):** `/menu/[branchSlug]?table=18`
   - Detected when restaurant lookup fails
   - Redirects to: `/menu/[restaurantSlug]/[branchSlug]?table=18`
   - Note: If multiple restaurants have same branch slug, first match is used

## Data Loading (Menu Page)

### Branch-Aware Queries

1. **Restaurant:** `restaurants.slug = restaurantSlug`
2. **Branch:** `branches.restaurant_id = restaurant.id AND branches.slug = branchSlug`
3. **Branch Social:** `branch_social.branch_id = branch.id`
4. **Branch Overrides:** `branch_menu_overrides.branch_id = branch.id`
5. **Menu Items:** `menu_items.restaurant_id = restaurant.id` + apply overrides
6. **Tables:** `restaurant_tables.branch_id = branch.id AND qr_slug = ?table`

### Effective Price Calculation

```typescript
effectivePrice = branchOverride?.price_override ?? menuItem.price
```

### Availability Filtering

```typescript
items.filter(item => item.is_available !== false)
```

## Debugging

### Development Logs

All routes log in development mode:

```typescript
console.log('[Menu Redirect] Received slug:', slug)
console.log('[Menu Redirect] Found branch slug, redirecting to:', redirectUrl)
console.log('[Menu Page] Loading data for:', { restaurantSlug, branchSlug })
console.log('[Menu Page] Restaurant found:', restaurantData.id)
console.log('[Menu Page] Branch found:', branchData.id)
```

### Error Messages

- Restaurant not found: `Restoran bulunamadı: [slug]`
- Branch not found: `Şube bulunamadı: [slug]`
- Invalid params: `Geçersiz URL parametreleri`

## Testing Checklist

- [ ] `/menu/restaurant-slug` redirects to default branch
- [ ] `/menu/restaurant-slug/branch-slug` loads menu
- [ ] `/menu/restaurant-slug/branch-slug?table=18` resolves table
- [ ] Old branch-only URLs redirect correctly
- [ ] QR codes generate correct format
- [ ] Branch overrides apply correctly
- [ ] Branch social settings load
- [ ] 404 page shows for invalid slugs

