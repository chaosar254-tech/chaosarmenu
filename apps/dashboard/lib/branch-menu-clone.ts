/**
 * Utility functions for cloning menu data between branches
 */

import { SupabaseClient } from '@supabase/supabase-js'

interface CategoryMapping {
  oldId: string
  newId: string
}

interface ItemMapping {
  oldId: string
  newId: string
}

/**
 * Clone all menu data (categories and items) from source branch to target branch
 * Creates new IDs for all entities and updates relationships (recommended_item_ids)
 */
export async function cloneBranchMenu(
  supabase: SupabaseClient,
  sourceBranchId: string,
  targetBranchId: string,
  restaurantId: string
): Promise<{ categoriesCloned: number; itemsCloned: number }> {
  console.log(`[Menu Clone] Starting clone from branch ${sourceBranchId} to ${targetBranchId}`)

  // Step 1: Clone categories
  const { data: sourceCategories, error: categoriesError } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('branch_id', sourceBranchId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (categoriesError) {
    throw new Error(`Failed to fetch source categories: ${categoriesError.message}`)
  }

  if (!sourceCategories || sourceCategories.length === 0) {
    console.log('[Menu Clone] No categories to clone')
    return { categoriesCloned: 0, itemsCloned: 0 }
  }

  // Create category mappings (oldId -> newId)
  const categoryMap: Map<string, string> = new Map()

  // Insert categories one by one to get new IDs
  for (const sourceCategory of sourceCategories) {
    const { data: newCategory, error: insertError } = await supabase
      .from('menu_categories')
      .insert({
        branch_id: targetBranchId,
        restaurant_id: restaurantId,
        name: sourceCategory.name,
        sort_order: sourceCategory.sort_order,
        is_active: sourceCategory.is_active,
        image_url: sourceCategory.image_url || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`[Menu Clone] Failed to clone category ${sourceCategory.id}:`, insertError)
      throw new Error(`Failed to clone category: ${insertError.message}`)
    }

    categoryMap.set(sourceCategory.id, newCategory.id)
    console.log(`[Menu Clone] Cloned category: ${sourceCategory.name} (${sourceCategory.id} -> ${newCategory.id})`)
  }

  // Step 2: Clone menu items
  const { data: sourceItems, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .eq('branch_id', sourceBranchId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (itemsError) {
    throw new Error(`Failed to fetch source items: ${itemsError.message}`)
  }

  if (!sourceItems || sourceItems.length === 0) {
    console.log('[Menu Clone] No items to clone')
    return { categoriesCloned: categoryMap.size, itemsCloned: 0 }
  }

  // Create item mappings (oldId -> newId)
  const itemMap: Map<string, string> = new Map()

  // Insert items one by one to get new IDs, then update recommended_item_ids
  for (const sourceItem of sourceItems) {
    // Map category ID to new category ID
    const newCategoryId = categoryMap.get(sourceItem.category_id)
    if (!newCategoryId) {
      console.warn(`[Menu Clone] Category ${sourceItem.category_id} not found in mapping, skipping item ${sourceItem.id}`)
      continue
    }

    // Insert item with mapped category
    const { data: newItem, error: insertError } = await supabase
      .from('menu_items')
      .insert({
        branch_id: targetBranchId,
        restaurant_id: restaurantId,
        category_id: newCategoryId,
        name: sourceItem.name,
        description: sourceItem.description || null,
        price: sourceItem.price,
        image_url: sourceItem.image_url || null,
        image_path: sourceItem.image_path || null,
        sort_order: sourceItem.sort_order,
        is_active: sourceItem.is_active,
        has_ar: sourceItem.has_ar || false,
        model_glb: sourceItem.model_glb || null,
        model_usdz: sourceItem.model_usdz || null,
        ingredients: sourceItem.ingredients || null,
        allergens: sourceItem.allergens || null,
        recommended_sides: sourceItem.recommended_sides || null,
        recommended_sides_auto: sourceItem.recommended_sides_auto || null,
        recommended_sides_source: sourceItem.recommended_sides_source || 'auto',
        // recommended_item_ids will be updated after all items are cloned
        recommended_item_ids: null, // Set to null initially
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`[Menu Clone] Failed to clone item ${sourceItem.id}:`, insertError)
      throw new Error(`Failed to clone item: ${insertError.message}`)
    }

    itemMap.set(sourceItem.id, newItem.id)
    console.log(`[Menu Clone] Cloned item: ${sourceItem.name} (${sourceItem.id} -> ${newItem.id})`)
  }

  // Step 3: Update recommended_item_ids with new item IDs
  for (const sourceItem of sourceItems) {
    const newItemId = itemMap.get(sourceItem.id)
    if (!newItemId || !sourceItem.recommended_item_ids || sourceItem.recommended_item_ids.length === 0) {
      continue
    }

    // Map old recommended_item_ids to new IDs
    const newRecommendedIds = sourceItem.recommended_item_ids
      .map((oldId: string) => itemMap.get(oldId))
      .filter((newId: string | undefined): newId is string => newId !== undefined)

    if (newRecommendedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ recommended_item_ids: newRecommendedIds })
        .eq('id', newItemId)

      if (updateError) {
        console.warn(`[Menu Clone] Failed to update recommended_item_ids for item ${newItemId}:`, updateError)
        // Don't throw - item is cloned, just missing recommendations
      } else {
        console.log(`[Menu Clone] Updated recommended_item_ids for item ${newItemId}: ${newRecommendedIds.length} recommendations`)
      }
    }
  }

  console.log(`[Menu Clone] Clone complete: ${categoryMap.size} categories, ${itemMap.size} items`)
  return { categoriesCloned: categoryMap.size, itemsCloned: itemMap.size }
}

