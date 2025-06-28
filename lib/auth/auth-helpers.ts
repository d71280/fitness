import { createServerComponentClient } from '@/lib/supabase'

// サーバーサイドでユーザー情報を取得
export async function getUser() {
  const supabase = createServerComponentClient()
  
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

// 管理者権限チェック（将来的にSupabase RLSで実装）
export async function isAdmin() {
  const user = await getUser()
  if (!user) return false
  
  // 今のところは全ログインユーザーを管理者とする
  // 将来的にはuser.app_metadataやカスタムクレームを使用
  return true
}