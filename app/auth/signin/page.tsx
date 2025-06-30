'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, Chrome } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // URLパラメータからエラーを取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    if (errorParam === 'auth-failed') {
      setError('認証に失敗しました。再度お試しください。')
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setError('')
        alert('確認メールを送信しました。メールをご確認ください。')
        setIsSignUp(false)
      }
    } catch (error: any) {
      setError(error.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('Signin - Starting Google OAuth')
      
      // 本番環境のURLを確実に指定
      const baseUrl = window.location.hostname.includes('vercel.app')
        ? 'https://fitness2-q2y0zojae-daiki-akiyama-9051s-projects.vercel.app'
        : window.location.origin
      
      console.log('Signin - Base URL:', baseUrl)
      console.log('Signin - Current origin:', window.location.origin)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=%2Fdashboard`,
        },
      })

      if (error) {
        console.error('Signin - Google OAuth error:', error)
        throw error
      }
      console.log('Signin - Google OAuth initiated successfully')
    } catch (error: any) {
      console.error('Signin - Google sign in failed:', error)
      setError(error.message || 'Googleログインに失敗しました')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isSignUp ? '新規登録' : 'ログイン'}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {isSignUp 
              ? '管理画面にアクセスするためのアカウントを作成してください'
              : '管理画面にアクセスするにはログインが必要です'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="パスワードを入力"
                  minLength={6}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-md bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              {/* Googleログインボタン */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogleSignIn}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Googleでログイン
              </Button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-3 text-gray-500 text-sm">または</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading 
                  ? (isSignUp ? '登録中...' : 'ログイン中...') 
                  : (isSignUp ? '登録' : 'ログイン')
                }
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setPassword('')
                  setEmail('')
                }}
              >
                {isSignUp ? 'ログインに戻る' : '新規登録'}
              </Button>
            </div>

            {!isSignUp && (
              <div className="text-sm text-gray-600 space-y-1 p-3 bg-blue-50 rounded-md">
                <p className="font-medium">テスト用アカウント:</p>
                <p>admin@studio.com / admin123</p>
                <p>staff@studio.com / staff123</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 