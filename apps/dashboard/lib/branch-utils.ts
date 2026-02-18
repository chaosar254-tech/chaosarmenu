import { cookies } from 'next/headers'

/**
 * Get active branch ID from cookie (server-side)
 */
export async function getActiveBranchId(): Promise<string | null> {
  const cookieStore = await cookies()
  const branchId = cookieStore.get('activeBranchId')?.value
  return branchId || null
}

/**
 * Validate that user owns the restaurant and branch belongs to restaurant
 */
export async function validateBranchAccess(
  supabase: any,
  branchId: string
): Promise<{ valid: boolean; restaurantId?: string; error?: string }> {
  try {
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { valid: false, error: 'Unauthorized' }
    }

    // Get branch with restaurant info
    const { data: branch, error } = await supabase
      .from('branches')
      .select('restaurant_id, restaurants!inner(owner_user_id)')
      .eq('id', branchId)
      .single()

    if (error || !branch) {
      return { valid: false, error: 'Branch not found' }
    }

    // Verify ownership
    if ((branch.restaurants as any).owner_user_id !== user.id) {
      return { valid: false, error: 'Forbidden' }
    }

    return { valid: true, restaurantId: branch.restaurant_id }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Validation error' }
  }
}

/**
 * Require branch ID from request (query param or cookie)
 */
export async function requireBranchId(
  request: Request,
  supabase: any
): Promise<{ branchId: string; restaurantId: string } | { error: string; status: number }> {
  // Try query param first
  const url = new URL(request.url)
  let branchId = url.searchParams.get('branch_id') || url.searchParams.get('branch')

  // Fallback to cookie
  if (!branchId) {
    branchId = await getActiveBranchId()
  }

  if (!branchId) {
    return { error: 'branch_id is required', status: 400 }
  }

  // Validate access
  const validation = await validateBranchAccess(supabase, branchId)
  if (!validation.valid) {
    return {
      error: validation.error || 'Invalid branch',
      status: validation.error === 'Forbidden' ? 403 : 404,
    }
  }

  return {
    branchId,
    restaurantId: validation.restaurantId!,
  }
}

