import { createApiRouteClient } from '@/lib/supabase'

// サーバーサイドでユーザー情報を取得
export async function getUser() {
  const supabase = createApiRouteClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('認証エラー:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return null
  }
}

// ユーザーがログイン済みかチェック
export async function isAuthenticated() {
  const user = await getUser()
  return !!user
}

// 管理者権限チェック
export async function isAdmin() {
  const user = await getUser()
  if (!user) return false
  
  const supabase = createApiRouteClient()
  
  try {
    // Check if user exists in admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('role')
      .eq('email', user.email)
      .single()
    
    if (error || !admin) {
      console.log('User not found in admins table:', user.email)
      return false
    }
    
    return admin.role === 'admin'
  } catch (error) {
    console.error('管理者チェックエラー:', error)
    return false
  }
}

// Get user role
export async function getUserRole() {
  const user = await getUser()
  if (!user) return null
  
  const supabase = createApiRouteClient()
  
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('role')
      .eq('email', user.email)
      .single()
    
    if (error || !admin) {
      return 'customer'
    }
    
    return admin.role
  } catch (error) {
    console.error('ロール取得エラー:', error)
    return 'customer'
  }
}

// Check if user can access dashboard
export async function canAccessDashboard() {
  const role = await getUserRole()
  return role === 'admin' || role === 'staff'
}