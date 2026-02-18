# Menu Item Branch ID Fix - Summary

## Bug Fixed
Menu item creation was failing with: `"Category <id> does not belong to branch <NULL>"` because `branch_id` was NULL when creating items.

## Root Cause
- Menu items are now branch-scoped (require `branch_id`)
- API route was not setting `branch_id` from cookie
- MenuManagement component was not filtering categories/items by `branch_id`

## Changes Made

### 1. API Route (`apps/dashboard/app/api/menu-items/route.ts`)

#### POST Handler:
- ✅ Gets `branchId` from cookie using `getActiveBranchId()` (server-side source of truth)
- ✅ Validates branch access using `validateBranchAccess()`
- ✅ Validates category belongs to selected branch
- ✅ Sets `branch_id` when inserting menu item
- ✅ AR limit check now filters by `branch_id` instead of `restaurant_id`
- ✅ Added comprehensive logging: `[Menu Items POST]`

#### PUT Handler:
- ✅ Gets `branchId` from cookie
- ✅ Validates item belongs to selected branch before updating
- ✅ Validates category belongs to selected branch (if category is being changed)
- ✅ AR limit check filters by `branch_id`
- ✅ Update query filters by `branch_id` to ensure item belongs to branch
- ✅ Added logging: `[Menu Items PUT]`

**Key Changes:**
```typescript
// Get branch_id from cookie (server-side source of truth)
const branchId = await getActiveBranchId()
if (!branchId) {
  return NextResponse.json(
    { error: 'Şube seçilmedi. Lütfen bir şube seçin.' },
    { status: 400 }
  )
}

// Validate branch access
const branchValidation = await validateBranchAccess(supabase, branchId)

// Validate category belongs to branch
const { data: category } = await supabase
  .from('menu_categories')
  .select('id, branch_id')
  .eq('id', category_id)
  .single()

if (category.branch_id !== branchId) {
  return NextResponse.json(
    { error: `Category does not belong to selected branch...` },
    { status: 400 }
  )
}

// Insert with branch_id
.insert({
  branch_id: branchId, // ✅ Set from cookie
  restaurant_id,
  category_id,
  // ... other fields
})
```

### 2. MenuManagement Component (`apps/dashboard/components/MenuManagement.tsx`)

#### loadData():
- ✅ Filters categories by `branch_id` instead of `restaurant_id`
- ✅ Filters items by `branch_id` instead of `restaurant_id`
- ✅ Only loads data when `activeBranchId` is set
- ✅ Removed branch overrides loading logic (no longer needed)
- ✅ Added logging: `[MenuManagement]`

**Before:**
```typescript
.eq('restaurant_id', restaurantId)  // ❌ Wrong
```

**After:**
```typescript
.eq('branch_id', activeBranchId)  // ✅ Correct
```

#### handleCategorySubmit():
- ✅ Blocks submission if no branch selected
- ✅ Includes `branch_id` when creating categories
- ✅ Validates category belongs to branch when updating
- ✅ Added logging

**Before:**
```typescript
.insert({ restaurant_id: restaurantId, name, sort_order: sortOrder })
```

**After:**
```typescript
.insert({
  branch_id: activeBranchId,  // ✅ Added
  restaurant_id: restaurantId,
  name,
  sort_order: sortOrder
})
```

#### handleItemSubmit():
- ✅ Blocks submission if no branch selected with clear error message
- ✅ Added client-side logging before sending requests
- ✅ Server automatically sets `branch_id` from cookie (no need to send in body)

**Error Handling:**
```typescript
if (!activeBranchId) {
  toast.error('Şube seçiniz. Lütfen bir şube seçin.')
  return
}
```

## Logging Added

### Server-side (API Route):
- `[Menu Items POST] branchId from cookie: <id> userId: <id> categoryId: <id>`
- `[Menu Items POST] Category branch mismatch: {...}`
- `[Menu Items POST] Successfully created item: <id> for branch: <id>`
- `[Menu Items PUT] branchId from cookie: <id> userId: <id> itemId: <id> categoryId: <id>`
- `[Menu Items PUT] Item branch mismatch: {...}`
- `[Menu Items PUT] Successfully updated item: <id> for branch: <id>`

### Client-side (MenuManagement):
- `[MenuManagement] Loading data for branch: <id>`
- `[MenuManagement] Loaded: { categories: <count>, items: <count> }`
- `[MenuManagement] handleItemSubmit - payload: { activeBranchId, categoryId, ... }`
- `[MenuManagement] Creating item with payload: {...}`
- `[MenuManagement] Created category: <id> for branch: <id>`

## Error Messages

### Clear Error Messages:
- `"Şube seçilmedi. Lütfen bir şube seçin."` - When branch not selected
- `"Category does not belong to selected branch. Selected branch: <id>, Category branch: <id>"` - Category mismatch
- `"Menu item does not belong to selected branch"` - Item mismatch (on update)
- `"Restaurant ID mismatch with selected branch"` - Restaurant validation

## Testing Checklist

✅ **Before testing:**
- [ ] Ensure migration `026_make_menu_items_branch_scoped.sql` is applied
- [ ] Ensure at least one branch exists for restaurant
- [ ] Branch selector is visible in dashboard header

✅ **Test menu item creation:**
- [ ] Select a branch from dropdown
- [ ] Create new menu item
- [ ] Verify item is created with correct `branch_id`
- [ ] Verify category belongs to same branch
- [ ] Check console logs show branchId

✅ **Test without branch selected:**
- [ ] Deselect branch (if possible) or clear cookie
- [ ] Try to create menu item
- [ ] Verify error message: "Şube seçiniz"

✅ **Test category creation:**
- [ ] Select branch
- [ ] Create new category
- [ ] Verify category has correct `branch_id`
- [ ] Verify categories dropdown only shows categories from selected branch

✅ **Test category/item filtering:**
- [ ] Switch between branches
- [ ] Verify categories and items change based on selected branch
- [ ] Verify items from branch A don't appear when branch B is selected

## Files Changed

1. ✅ `apps/dashboard/app/api/menu-items/route.ts`
   - POST handler: Added branch_id validation and setting
   - PUT handler: Added branch_id validation

2. ✅ `apps/dashboard/components/MenuManagement.tsx`
   - loadData(): Filter by branch_id
   - handleCategorySubmit(): Include branch_id, block if no branch
   - handleItemSubmit(): Block if no branch, add logging

## Breaking Changes

⚠️ **None** - This is a bug fix. However:
- Menu items MUST have a branch selected to create/edit
- Categories MUST belong to the selected branch
- Branch selector should always be visible and have a branch selected

## Remaining Work (Not Blocking)

- Remove `toggleBranchAvailability` function (branch_menu_overrides no longer exists)
- Remove branch overrides UI elements
- Update customer menu page to filter by branch_id (if not already done)
- Consider adding branch_id to menu_events table for branch-scoped analytics



