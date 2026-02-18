# Branch-Scoped Menu Implementation Status

## ✅ Completed

### 1. Database Migration (`026_make_menu_items_branch_scoped.sql`)
- ✅ Added `branch_id` to `menu_items` and `menu_categories`
- ✅ Migration script to assign existing data to default branches
- ✅ Indexes created for branch_id queries
- ✅ Trigger to validate category belongs to same branch
- ✅ RLS policies updated for branch-scoped access
- ✅ `branch_menu_overrides` table dropped

### 2. Branch Creation with Menu Cloning
- ✅ API endpoint updated to accept `copy_menu_from_branch_id`
- ✅ Menu cloning function created (`lib/branch-menu-clone.ts`)
- ✅ Clones categories with new IDs
- ✅ Clones items with new IDs
- ✅ Updates `recommended_item_ids` relationships
- ✅ Error handling and logging

### 3. UI Updates
- ✅ Branch creation modal has source branch selector
- ✅ Defaults to first branch (main branch)
- ✅ Shows helpful text about menu cloning

## ⚠️ REQUIRED: Query Updates

### Critical Files That Must Be Updated:

#### 1. MenuManagement Component (`apps/dashboard/components/MenuManagement.tsx`)

**Current Issue:** Queries filter by `restaurant_id` instead of `branch_id`

**Required Changes:**

```typescript
// BEFORE (line 107-111):
const { data: cats } = await supabase
  .from('menu_categories')
  .select('id, name, sort_order, is_active, image_url')
  .eq('restaurant_id', restaurantId)  // ❌ WRONG
  .order('sort_order', { ascending: true })

// AFTER:
const { data: cats } = await supabase
  .from('menu_categories')
  .select('id, name, sort_order, is_active, image_url')
  .eq('branch_id', activeBranchId)  // ✅ CORRECT
  .order('sort_order', { ascending: true })

// BEFORE (line 113-117):
const { data: its } = await supabase
  .from('menu_items')
  .select('...')
  .eq('restaurant_id', restaurantId)  // ❌ WRONG
  .order('sort_order', { ascending: true })

// AFTER:
const { data: its } = await supabase
  .from('menu_items')
  .select('...')
  .eq('branch_id', activeBranchId)  // ✅ CORRECT
  .order('sort_order', { ascending: true })
```

**Also Remove:**
- Lines 122-148: Branch overrides loading logic (no longer needed)
- `branchOverrides` state and `toggleBranchAvailability` function
- All references to `/api/branches/${activeBranchId}/menu-overrides`

**Category Creation (line 180):**
```typescript
// BEFORE:
.insert({ restaurant_id: restaurantId, name, sort_order: sortOrder })

// AFTER:
.insert({ branch_id: activeBranchId, restaurant_id: restaurantId, name, sort_order: sortOrder })
```

**Item Creation (lines 324, 378, 451):**
```typescript
// BEFORE:
restaurant_id: restaurantId,
category_id: categoryId,
// ... other fields

// AFTER:
branch_id: activeBranchId,  // ADD THIS
restaurant_id: restaurantId,
category_id: categoryId,  // Must be category in same branch
// ... other fields
```

#### 2. Menu Items API Route (`apps/dashboard/app/api/menu-items/route.ts`)

**POST Handler:**
```typescript
// BEFORE:
const { restaurant_id, category_id, name, ... } = body

// AFTER:
const { branch_id, restaurant_id, category_id, name, ... } = body

// Validate branch_id is provided
if (!branch_id) {
  return NextResponse.json({ error: 'branch_id is required' }, { status: 400 })
}

// Verify branch belongs to restaurant
const { data: branch } = await supabase
  .from('branches')
  .select('restaurant_id')
  .eq('id', branch_id)
  .single()

if (!branch || branch.restaurant_id !== restaurant_id) {
  return NextResponse.json({ error: 'Invalid branch_id' }, { status: 403 })
}

// Count AR products per branch (not restaurant)
const { data: existingARProducts } = await supabase
  .from('menu_items')
  .select('id')
  .eq('branch_id', branch_id)  // ✅ Filter by branch
  .eq('has_ar', true)
  .not('model_glb', 'is', null)

// Insert with branch_id
.insert({
  branch_id,  // ✅ ADD THIS
  restaurant_id,
  category_id,
  // ... other fields
})
```

**PUT/DELETE Handlers:**
- Add `branch_id` validation
- Filter updates/deletes by `branch_id`

#### 3. Customer Menu Page (`apps/menu/app/menu/[restaurantSlug]/[branchSlug]/page.tsx`)

**Verify queries already filter by branch:**
```typescript
// Should already be correct:
.from('menu_items')
.select('...')
.eq('restaurant_id', restaurantData.id)  // ❌ Should be branch_id
.eq('is_active', true)

// Should be:
.from('menu_items')
.select('...')
.eq('branch_id', branchData.id)  // ✅ CORRECT
.eq('is_active', true)

// Same for categories:
.from('menu_categories')
.select('...')
.eq('branch_id', branchData.id)  // ✅ CORRECT
.eq('is_active', true)
```

#### 4. Category API Routes (if exists)

Similar pattern - filter by `branch_id` instead of `restaurant_id`

## Testing Checklist

### Before Deploying:
- [ ] Run migration on staging/dev database
- [ ] Verify all queries updated to use `branch_id`
- [ ] Test branch creation with menu cloning
- [ ] Test creating items in different branches
- [ ] Verify items don't appear in wrong branches
- [ ] Test recommended_item_ids relationships
- [ ] Remove branch_menu_overrides API routes
- [ ] Update customer menu queries

### After Deploying:
- [ ] Monitor for query errors (missing branch_id)
- [ ] Verify migration completed successfully
- [ ] Check logs for menu cloning errors
- [ ] Test branch creation in production

## Files Changed Summary

### Created:
1. `supabase/migrations/026_make_menu_items_branch_scoped.sql`
2. `apps/dashboard/lib/branch-menu-clone.ts`
3. `BRANCH_MENU_SCOPING_IMPLEMENTATION.md`
4. `IMPLEMENTATION_STATUS.md`

### Modified:
1. `apps/dashboard/app/api/branches/route.ts` - Added menu cloning support
2. `apps/dashboard/components/BranchManagement.tsx` - Added source branch selector

### Need Modification:
1. `apps/dashboard/components/MenuManagement.tsx` - **CRITICAL** - Update all queries
2. `apps/dashboard/app/api/menu-items/route.ts` - **CRITICAL** - Add branch_id validation
3. `apps/menu/app/menu/[restaurantSlug]/[branchSlug]/page.tsx` - Verify/fix queries
4. Any category API routes - Update to use branch_id

### Can Be Removed:
1. `apps/dashboard/app/api/branches/[id]/menu-overrides/route.ts` - No longer needed
2. References to `branch_menu_overrides` table

## Next Steps

1. **IMMEDIATE**: Update MenuManagement.tsx queries (highest priority)
2. **IMMEDIATE**: Update menu-items API route (highest priority)
3. Update customer menu page queries
4. Remove branch_menu_overrides API routes
5. Test thoroughly in staging
6. Deploy migration and code updates together

## Rollback Strategy

If issues occur:
1. Revert code changes (queries will fail, but data is safe)
2. Migration cannot be easily rolled back (would need to reassign items)
3. **Better**: Test thoroughly before deploying

