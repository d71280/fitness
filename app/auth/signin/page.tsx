'use client'

import React, { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        // ログイン成功時にセッションを確認
        const session = await getSession()
        if (session?.user?.role === 'admin') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('admin@demo.com')
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">管理者ログイン</h1>
          <p className="mt-2 text-gray-600">
            フィットネススタジオ予約システム
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              ログイン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 font-medium mb-2">
                🎯 デモアカウント
              </p>
              <p className="text-xs text-blue-600 mb-3">
                データベースが利用できない環境でも動作確認可能
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoCredentials}
                className="w-full"
              >
                デモアカウント情報を入力
              </Button>
              <div className="mt-2 text-xs text-blue-600">
                Email: admin@demo.com<br />
                Password: demo123
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
          >
            ← ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}