# Branch-Scoped Menu Items Implementation

## Overview
Menu items and categories are now branch-scoped instead of restaurant-scoped. Each branch has its own independent copy of menu data. When creating a new branch, menu data can be cloned from an existing branch.

## Database Changes

### Migration: `026_make_menu_items_branch_scoped.sql`

**Changes:**
1. Added `branch_id` column to `menu_items` and `menu_categories` tables
2. Migrated existing data to default branches (one per restaurant)
3. Made `branch_id` required (NOT NULL)
4. Added indexes for branch_id queries
5. Added trigger to validate category belongs to same branch as item
6. **Dropped `branch_menu_overrides` table** (no longer needed - items are branch-scoped)
7. Updated RLS policies for branch-scoped access

**Migration Steps:**
- For each restaurant, finds/creates default branch ("Ana Şube")
- Assigns all existing categories and items to default branch
- Cleans up recommended_item_ids to only reference items within same branch

**Important:** After migration, all menu items must have a `branch_id`. The `restaurant_id` column is kept for backward compatibility and analytics, but queries should filter by `branch_id`.

## API Changes

### Branch Creation API (`/api/branches` POST)

**New Parameter:**
- `copy_menu_from_branch_id` (optional): ID of source branch to clone menu from

**Behavior:**
- If `copy_menu_from_branch_id` is provided, clones all categories and items from source branch
- Creates new IDs for all entities
- Updates `recommended_item_ids` relationships to use new IDs
- If cloning fails, branch is still created (user can manually add items)

### Menu Clone Function (`lib/branch-menu-clone.ts`)

**Function:** `cloneBranchMenu(sourceBranchId, targetBranchId, restaurantId)`

**Process:**
1. Fetch all active categories from source branch
2. Clone categories with new IDs, create mapping (oldId -> newId)
3. Fetch all active items from source branch
4. Clone items with new IDs, map category references
5. Update `recommended_item_ids` arrays with new item IDs

**Logging:**
- Logs each cloned category/item
- Logs count of cloned entities
- Errors are caught and logged (don't fail branch creation)

## UI Changes

### Branch Management (`BranchManagement.tsx`)

**New Features:**
- Source branch selector dropdown in branch creation modal
- Defaults to first branch (main branch) for menu copying
- Shows helpful text explaining menu cloning
- Only shown when creating new branch (not when editing)

**Form Fields:**
```typescript
{
  name: string
  slug: string
  address: string
  phone: string
  is_active: boolean
  copy_menu_from_branch_id: string // NEW
}
```

## Query Updates Required

### ⚠️ CRITICAL: All menu queries must be updated to filter by `branch_id`

**Files that need updating:**

1. **Menu Item API Routes** (`apps/dashboard/app/api/menu-items/route.ts`)
   - POST: Must require `branch_id` instead of `restaurant_id`
   - GET: Filter by `branch_id`
   - PUT: Filter by `branch_id`
   - DELETE: Filter by `branch_id`

2. **Menu Management Component** (`apps/dashboard/components/MenuManagement.tsx`)
   - `loadData()`: Query categories and items filtered by `activeBranchId`
   - `handleCategorySubmit()`: Include `branch_id` when creating/updating
   - `handleItemSubmit()`: Include `branch_id` when creating/updating
   - Remove `branchOverrides` logic (no longer needed)

3. **Customer Menu Page** (`apps/menu/app/menu/[restaurantSlug]/[branchSlug]/page.tsx`)
   - Already filters by branch (good)
   - Verify it doesn't use `restaurant_id` filter on menu_items

4. **Category API Routes** (if exists: `apps/dashboard/app/api/menu-categories/route.ts`)
   - Must filter by `branch_id`

5. **Dashboard Analytics** (`apps/dashboard/app/dashboard/page.tsx`)
   - Currently filters by `restaurant_id`
   - Should filter by `activeBranchId` for branch-scoped metrics
   - Note: `menu_events` table doesn't have `branch_id` yet (future work)

## Migration Checklist

### Before Running Migration:
- [ ] Backup database
- [ ] Test migration on staging/dev environment
- [ ] Verify all restaurants have at least one branch

### After Migration:
- [ ] Verify all menu_items have `branch_id` (should be 100%)
- [ ] Verify all menu_categories have `branch_id` (should be 100%)
- [ ] Test branch creation with menu cloning
- [ ] Test creating menu items in different branches
- [ ] Verify items in branch A don't appear in branch B
- [ ] Test recommended_item_ids relationships

### Code Updates (Required):
- [ ] Update MenuManagement component queries
- [ ] Update menu-items API routes
- [ ] Update menu-categories API routes (if exists)
- [ ] Remove branch_menu_overrides references
- [ ] Update any analytics queries to use branch_id
- [ ] Test all CRUD operations with branch_id

## Testing Plan

### Test 1: Branch Creation with Menu Cloning
1. Create branch A with menu items
2. Create branch B, select "copy menu from branch A"
3. Verify branch B has same categories/items (different IDs)
4. Verify recommended_item_ids work correctly in branch B

### Test 2: Independent Menu Editing
1. Add item to branch A
2. Verify item does NOT appear in branch B
3. Edit item in branch A
4. Verify changes do NOT affect branch B

### Test 3: Recommended Items
1. Item A in branch 1 recommends Item B in branch 1
2. Clone branch 1 to branch 2
3. Verify Item A' in branch 2 recommends Item B' in branch 2 (new IDs)
4. Verify Item A' does NOT recommend Item B from branch 1

### Test 4: Migration Validation
1. Count items before migration: `SELECT COUNT(*) FROM menu_items WHERE branch_id IS NULL` (should be 0 after)
2. Count categories before migration: `SELECT COUNT(*) FROM menu_categories WHERE branch_id IS NULL` (should be 0 after)
3. Verify all restaurants have default branch: `SELECT COUNT(DISTINCT restaurant_id) FROM restaurants` = `SELECT COUNT(DISTINCT restaurant_id) FROM branches`

## Rollback Plan

If migration fails:
1. Migration uses transactions, should rollback automatically
2. If partial migration, manually set `branch_id` to NULL for affected rows
3. Re-run migration after fixing issues

If code updates break production:
1. Revert code changes
2. Migration is already applied, so queries will fail
3. Need to revert migration OR add temporary `branch_id IS NOT NULL` filters
4. **Better:** Test thoroughly in staging first

## Future Enhancements

1. **Multi-branch Item Creation**: "Add this item to other branches" feature (manual, not auto-sync)
2. **Branch-level Analytics**: Add `branch_id` to `menu_events` table
3. **Bulk Operations**: Clone/update items across multiple branches
4. **Menu Templates**: Save menu as template, apply to new branches

## Important Notes

⚠️ **Breaking Change**: This is a significant architectural change. All menu queries must be updated to use `branch_id`.

⚠️ **Migration Safety**: The migration is designed to be safe:
- Creates default branches if they don't exist
- Preserves all existing data
- Handles edge cases (missing categories, invalid references)

⚠️ **Performance**: Indexes are added for `branch_id` queries. Query performance should be similar or better than restaurant-scoped queries.

⚠️ **RLS Policies**: Updated to check branch ownership through restaurant ownership chain. Public read access is still allowed for active items/categories.

