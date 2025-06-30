'use client'

// 動的レンダリングを強制してプリレンダリングエラーを回避
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugAuth() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const checkAuth = async () => {
    setLoading(true)
    
    // ユーザー情報取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User check:', { user, userError })
    
    // セッション情報取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', { session, sessionError })
    
    setUser(user)
    setSession(session)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const testGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/debug-auth`,
      },
    })
    console.log('Google signin attempt:', { data, error })
  }

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', { event, session: session?.user?.id })
      setUser(session?.user ?? null)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>認証デバッグ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">認証状態:</h3>
            <p className="text-sm">ユーザー: {user ? '✅ ログイン済み' : '❌ ログインしていません'}</p>
            <p className="text-sm">セッション: {session ? '✅ 有効' : '❌ 無効'}</p>
          </div>

          {user && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold text-green-800">ユーザー情報:</h4>
              <pre className="text-xs text-green-700 mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {session && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-800">セッション情報:</h4>
              <pre className="text-xs text-blue-700 mt-2 overflow-auto">
                {JSON.stringify({
                  access_token: session.access_token ? '***' : null,
                  refresh_token: session.refresh_token ? '***' : null,
                  expires_at: session.expires_at,
                  user: session.user?.id
                }, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={checkAuth}>
              認証状態を再確認
            </Button>
            <Button onClick={testGoogleSignIn} variant="outline">
              Googleログインテスト
            </Button>
            {user && (
              <Button onClick={signOut} variant="destructive">
                サインアウト
              </Button>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold text-yellow-800">環境変数確認:</h4>
            <p className="text-xs text-yellow-700">
              SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定'}
            </p>
            <p className="text-xs text-yellow-700">
              SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定'}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>このページでGoogleログインをテストして、認証後にこのページに戻ってくるかを確認できます。</p>
            <p>ブラウザの開発者ツールでコンソールログも確認してください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 