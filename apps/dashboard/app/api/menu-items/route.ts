import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanLimit, PLAN_LIMITS } from '@/lib/plan-limits'
import { BUCKET_MENU_IMAGES } from '@/lib/storage-constants'
import { ALLOWED_ALLERGEN_KEYS } from '@/lib/allergens'
import { getActiveBranchId, validateBranchAccess } from '@/lib/branch-utils'
import { checkSubscriptionStatus } from '@/lib/subscription-check'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check subscription status (soft lock)
    const subscriptionCheck = await checkSubscriptionStatus()
    if (!subscriptionCheck.hasActiveSubscription) {
      return NextResponse.json(
        { 
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { restaurant_id, category_id, name, description, price, image_url, image_path, sort_order, is_active, has_ar, model_glb, model_usdz, ingredients, recommended_item_ids, allergens, recommended_sides, recommended_sides_auto, recommended_sides_source, name_en, name_ar, description_en, description_ar } = body

    // Get branch_id from cookie (server-side source of truth)
    const branchId = await getActiveBranchId()
    console.log('[Menu Items POST] branchId from cookie:', branchId, 'userId:', user.id, 'categoryId:', category_id)

    if (!branchId) {
      return NextResponse.json(
        { error: 'Şube seçilmedi. Lütfen bir şube seçin.' },
        { status: 400 }
      )
    }

    // Validate branch access
    const branchValidation = await validateBranchAccess(supabase, branchId)
    if (!branchValidation.valid) {
      return NextResponse.json(
        { error: branchValidation.error || 'Geçersiz şube erişimi' },
        { status: branchValidation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    // Validate allergens: must be subset of allowed keys, max 20, no duplicates
    let validatedAllergens: string[] = []
    if (allergens && Array.isArray(allergens)) {
      // Remove duplicates, keep only string values that are in ALLOWED_ALLERGEN_KEYS
      const uniqueAllergens = Array.from(
        new Set(
          allergens.filter(
            (a: any) =>
              a &&
              typeof a === 'string' &&
              ALLOWED_ALLERGEN_KEYS.includes(a)
          )
        )
      ) as any[]

      validatedAllergens = uniqueAllergens.slice(0, 20)
    }

    // Validate ingredients: max 20, each max 40 chars, trim + remove empty
    let validatedIngredients: string[] | null = null
    if (ingredients && Array.isArray(ingredients)) {
      validatedIngredients = ingredients
        .map((ing: any) => String(ing).trim())
        .filter((ing: string) => ing.length > 0)
        .slice(0, 20)
        .map((ing: string) => ing.substring(0, 40))
      if (validatedIngredients.length === 0) {
        validatedIngredients = null
      }
    }

    // Validate recommended_item_ids: max 6, no self-id, no duplicates
    let validatedRecommendedIds: string[] | null = null
    if (recommended_item_ids && Array.isArray(recommended_item_ids)) {
      // Remove duplicates and filter out empty/null (without using Set to avoid TS downlevelIteration issues)
      const filteredIds = recommended_item_ids.filter(
        (id: any) => id && String(id).trim() !== ''
      )

      const uniqueIds = filteredIds.filter(
        (value, index, self) => self.indexOf(value) === index
      )

      validatedRecommendedIds = uniqueIds.slice(0, 6)
      if (validatedRecommendedIds.length === 0) {
        validatedRecommendedIds = null
      }
    }

    // Validate required fields
    if (!restaurant_id || !category_id || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify restaurant_id matches branch's restaurant
    if (branchValidation.restaurantId !== restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant ID mismatch with selected branch' },
        { status: 400 }
      )
    }

    // Validate that category belongs to the same branch
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, branch_id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.branch_id !== branchId) {
      console.error('[Menu Items POST] Category branch mismatch:', {
        categoryId: category_id,
        categoryBranchId: category.branch_id,
        selectedBranchId: branchId,
      })
      return NextResponse.json(
        { error: `Category does not belong to selected branch. Selected branch: ${branchId}, Category branch: ${category.branch_id}` },
        { status: 400 }
      )
    }

    // Get restaurant for plan limits check
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, plan')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Check if this is an AR product
    const isARProduct = has_ar === true && model_glb && model_glb.trim() !== ''

    // If it's an AR product, check plan limits (count per branch)
    if (isARProduct) {
      const plan = restaurant.plan || 'starter'
      const limit = getPlanLimit(plan)

      // Count existing AR products for this branch
      const { data: existingARProducts, error: countError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('branch_id', branchId)
        .eq('has_ar', true)
        .not('model_glb', 'is', null)

      if (countError) {
        console.error('[Menu Items POST] AR limit check error:', countError)
        return NextResponse.json(
          { error: 'Failed to check AR limit' },
          { status: 500 }
        )
      }

      const currentARCount = existingARProducts?.length || 0

      // Check if limit is reached
      if (currentARCount >= limit) {
        return NextResponse.json(
          { error: 'AR_LIMIT_REACHED', message: `Plan limit reached. Your ${plan} plan allows ${limit === Infinity ? 'unlimited' : limit} AR products per branch.` },
          { status: 403 }
        )
      }
    }

    // Insert the menu item with branch_id
    const { data: newItem, error: insertError } = await supabase
      .from('menu_items')
      .insert({
        branch_id: branchId, // Set branch_id from cookie
        restaurant_id,
        category_id,
        name,
        description: description || null,
        price,
        image_url: image_url || null, // Legacy field
        image_path: image_path || null, // New field for storage path
        sort_order: sort_order || 0,
        is_active: is_active !== false,
        has_ar: has_ar || false,
        model_glb: model_glb || null,
        model_usdz: model_usdz || null,
        ingredients: validatedIngredients,
        recommended_item_ids: validatedRecommendedIds,
        allergens: validatedAllergens,
        name_en: name_en != null && typeof name_en === 'string' ? name_en.trim() || null : null,
        name_ar: name_ar != null && typeof name_ar === 'string' ? name_ar.trim() || null : null,
        description_en: description_en != null && typeof description_en === 'string' ? description_en.trim() || null : null,
        description_ar: description_ar != null && typeof description_ar === 'string' ? description_ar.trim() || null : null,
        // Only include recommended_sides fields if explicitly provided
        ...(recommended_sides !== undefined && { recommended_sides: recommended_sides && typeof recommended_sides === 'string' ? recommended_sides.trim() || null : null }),
        ...(recommended_sides_auto !== undefined && { recommended_sides_auto: recommended_sides_auto && typeof recommended_sides_auto === 'string' ? recommended_sides_auto.trim() || null : null }),
        ...(recommended_sides_source !== undefined && { recommended_sides_source: recommended_sides_source === 'manual' ? 'manual' : 'auto' }),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Menu Items POST] Insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      )
    }

    console.log('[Menu Items POST] Successfully created item:', newItem?.id, 'for branch:', branchId)
    return NextResponse.json({ data: newItem }, { status: 201 })
  } catch (error: any) {
    console.error('Menu item creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSupabaseClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check subscription status (soft lock)
    const subscriptionCheck = await checkSubscriptionStatus()
    if (!subscriptionCheck.hasActiveSubscription) {
      return NextResponse.json(
        { 
          error: 'SUBSCRIPTION_EXPIRED',
          message: 'Aboneliğiniz sona ermiş. Devam etmek için lütfen ödeme yapın.',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, restaurant_id, category_id, name, description, price, image_url, image_path, sort_order, is_active, has_ar, model_glb, model_usdz, ingredients, recommended_item_ids, allergens, recommended_sides, recommended_sides_auto, recommended_sides_source, name_en, name_ar, description_en, description_ar } = body

    // Get branch_id from cookie (server-side source of truth)
    const branchId = await getActiveBranchId()
    console.log('[Menu Items PUT] branchId from cookie:', branchId, 'userId:', user.id, 'itemId:', id, 'categoryId:', category_id)

    if (!branchId) {
      return NextResponse.json(
        { error: 'Şube seçilmedi. Lütfen bir şube seçin.' },
        { status: 400 }
      )
    }

    // Validate branch access
    const branchValidation = await validateBranchAccess(supabase, branchId)
    if (!branchValidation.valid) {
      return NextResponse.json(
        { error: branchValidation.error || 'Geçersiz şube erişimi' },
        { status: branchValidation.error === 'Forbidden' ? 403 : 400 }
      )
    }

    // Validate allergens: must be subset of allowed keys, max 20, no duplicates
    let validatedAllergens: string[] = []
    if (allergens && Array.isArray(allergens)) {
      // Remove duplicates, keep only string values that are in ALLOWED_ALLERGEN_KEYS
      const uniqueAllergens = Array.from(
        new Set(
          allergens.filter(
            (a: any) =>
              a &&
              typeof a === 'string' &&
              ALLOWED_ALLERGEN_KEYS.includes(a)
          )
        )
      ) as any[]

      validatedAllergens = uniqueAllergens.slice(0, 20)
    }

    // Validate ingredients: max 20, each max 40 chars, trim + remove empty
    let validatedIngredients: string[] | null = null
    if (ingredients && Array.isArray(ingredients)) {
      validatedIngredients = ingredients
        .map((ing: any) => String(ing).trim())
        .filter((ing: string) => ing.length > 0)
        .slice(0, 20)
        .map((ing: string) => ing.substring(0, 40))
      if (validatedIngredients.length === 0) {
        validatedIngredients = null
      }
    }

    // Validate recommended_item_ids: max 6, no self-id, no duplicates
    let validatedRecommendedIds: string[] | null = null
    if (recommended_item_ids && Array.isArray(recommended_item_ids)) {
      // Remove duplicates and filter out empty/null, exclude self-id (without using Set to avoid TS downlevelIteration issues)
      const filteredIds = recommended_item_ids.filter(
        (itemId: any) =>
          itemId &&
          String(itemId).trim() !== '' &&
          itemId !== id
      )

      const uniqueIds = filteredIds.filter(
        (value, index, self) => self.indexOf(value) === index
      )

      validatedRecommendedIds = uniqueIds.slice(0, 6)
      if (validatedRecommendedIds.length === 0) {
        validatedRecommendedIds = null
      }
    }

    // Validate required fields
    if (!id || !restaurant_id || !category_id || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify restaurant_id matches branch's restaurant
    if (branchValidation.restaurantId !== restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant ID mismatch with selected branch' },
        { status: 400 }
      )
    }

    // Get current item and verify it belongs to the selected branch
    const { data: currentItem, error: currentItemError } = await supabase
      .from('menu_items')
      .select('has_ar, model_glb, branch_id')
      .eq('id', id)
      .single()

    if (currentItemError || !currentItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Verify item belongs to selected branch
    if (currentItem.branch_id !== branchId) {
      console.error('[Menu Items PUT] Item branch mismatch:', {
        itemId: id,
        itemBranchId: currentItem.branch_id,
        selectedBranchId: branchId,
      })
      return NextResponse.json(
        { error: 'Menu item does not belong to selected branch' },
        { status: 403 }
      )
    }

    // Validate that category belongs to the same branch (if category is being changed)
    const { data: category, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, branch_id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.branch_id !== branchId) {
      console.error('[Menu Items PUT] Category branch mismatch:', {
        categoryId: category_id,
        categoryBranchId: category.branch_id,
        selectedBranchId: branchId,
      })
      return NextResponse.json(
        { error: `Category does not belong to selected branch. Selected branch: ${branchId}, Category branch: ${category.branch_id}` },
        { status: 400 }
      )
    }

    // Get restaurant for plan limits check
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, plan')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Check if this update makes it an AR product
    const isARProduct = has_ar === true && model_glb && model_glb.trim() !== ''
    const wasARProduct = currentItem.has_ar === true && currentItem.model_glb && currentItem.model_glb.trim() !== ''

    // If updating to AR product (and it wasn't before), check plan limits (per branch)
    if (isARProduct && !wasARProduct) {
      const plan = restaurant.plan || 'starter'
      const limit = getPlanLimit(plan)

      // Count existing AR products for this branch (exclude current item)
      const { data: existingARProducts, error: countError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('branch_id', branchId)
        .eq('has_ar', true)
        .not('model_glb', 'is', null)
        .neq('id', id)

      if (countError) {
        console.error('[Menu Items PUT] AR limit check error:', countError)
        return NextResponse.json(
          { error: 'Failed to check AR limit' },
          { status: 500 }
        )
      }

      const currentARCount = existingARProducts?.length || 0

      // Check if limit is reached
      if (currentARCount >= limit) {
        return NextResponse.json(
          { error: 'AR_LIMIT_REACHED', message: `Plan limit reached. Your ${plan} plan allows ${limit === Infinity ? 'unlimited' : limit} AR products per branch.` },
          { status: 403 }
        )
      }
    }

    // If image_path is being updated, delete old image from storage if it exists
    if (image_path) {
      const { data: currentItem } = await supabase
        .from('menu_items')
        .select('image_path')
        .eq('id', id)
        .single()

      // Delete old image if it exists and is different
      if (currentItem?.image_path && currentItem.image_path !== image_path) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_MENU_IMAGES)
          .remove([currentItem.image_path])
        
        if (deleteError) {
          console.error('Failed to delete old image:', {
            bucket: BUCKET_MENU_IMAGES,
            path: currentItem.image_path,
            error: deleteError.message,
          })
          // Continue with update even if delete fails
        }
      }
    }

    // Update the menu item
    // Only include recommended_sides fields if they are explicitly provided (to avoid touching existing values)
    const updatePayload: any = {
      category_id,
      name,
      description: description || null,
      price,
      image_url: image_url || null, // Legacy field
      image_path: image_path || null, // New field for storage path
      sort_order: sort_order || 0,
      is_active: is_active !== false,
      has_ar: has_ar || false,
      model_glb: model_glb || null,
      model_usdz: model_usdz || null,
      ingredients: validatedIngredients,
      recommended_item_ids: validatedRecommendedIds,
      allergens: validatedAllergens,
      name_en: name_en != null && typeof name_en === 'string' ? name_en.trim() || null : null,
      name_ar: name_ar != null && typeof name_ar === 'string' ? name_ar.trim() || null : null,
      description_en: description_en != null && typeof description_en === 'string' ? description_en.trim() || null : null,
      description_ar: description_ar != null && typeof description_ar === 'string' ? description_ar.trim() || null : null,
    }

    // Only include recommended_sides fields if explicitly provided in the request
    if (recommended_sides !== undefined) {
      updatePayload.recommended_sides = recommended_sides && typeof recommended_sides === 'string' ? recommended_sides.trim() || null : null
    }
    if (recommended_sides_auto !== undefined) {
      updatePayload.recommended_sides_auto = recommended_sides_auto && typeof recommended_sides_auto === 'string' ? recommended_sides_auto.trim() || null : null
    }
    if (recommended_sides_source !== undefined) {
      updatePayload.recommended_sides_source = recommended_sides_source === 'manual' ? 'manual' : 'auto'
    }

    console.log('PUT /api/menu-items - update payload:', {
      id,
      restaurant_id,
      hasIngredients: !!updatePayload.ingredients,
      ingredientsCount: updatePayload.ingredients?.length || 0,
      hasAllergens: !!updatePayload.allergens,
      allergensCount: updatePayload.allergens?.length || 0,
      recommendedSides: updatePayload.recommended_sides,
      recommendedSidesAuto: updatePayload.recommended_sides_auto,
      recommendedSidesSource: updatePayload.recommended_sides_source,
    })

    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id)
      .eq('branch_id', branchId) // Filter by branch_id to ensure item belongs to branch
      .select()
      .single()

    if (updateError) {
      console.error('PUT /api/menu-items - Supabase update error:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      return NextResponse.json(
        { 
          error: 'Update failed', 
          details: updateError.message,
          code: updateError.code,
        },
        { status: 400 }
      )
    }

    console.log('[Menu Items PUT] Successfully updated item:', updatedItem?.id, 'for branch:', branchId)
    return NextResponse.json({ data: updatedItem }, { status: 200 })
  } catch (error: any) {
    console.error('PUT /api/menu-items - exception:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

