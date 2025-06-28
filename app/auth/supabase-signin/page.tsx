'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// 仮のユーザーデータベース（実際の実装では、データベースやAPIを使用）
const USERS = [
  { email: 'admin@studio.com', password: 'admin123', name: '管理者' },
  { email: 'staff@studio.com', password: 'staff123', name: 'スタッフ' }
]

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 簡単な認証チェック
      const user = USERS.find(u => u.email === email && u.password === password)
      
      if (user) {
        // ログイン成功
        localStorage.setItem('user', JSON.stringify({ email: user.email, name: user.name }))
        setMessage('ログインに成功しました')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setMessage('メールアドレスまたはパスワードが正しくありません')
      }
    } catch (error) {
      setMessage('ログイン中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 既存ユーザーチェック
      const existingUser = USERS.find(u => u.email === email)
      
      if (existingUser) {
        setMessage('このメールアドレスは既に登録されています')
      } else {
        // 新規登録（実際の実装では、データベースに保存）
        USERS.push({ email, password, name })
        setMessage('登録が完了しました。ログインしてください。')
        setIsSignUp(false)
        setName('')
        setPassword('')
      }
    } catch (error) {
      setMessage('登録中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? '新規登録' : 'ログイン'}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? '管理画面アカウントを作成してください'
              : '管理画面にアクセスするにはログインが必要です'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="山田 太郎"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワードを入力"
                minLength={6}
              />
            </div>

            {message && (
              <div className={`p-3 rounded text-sm ${
                message.includes('成功') || message.includes('完了')
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-2">
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
                  setMessage('')
                  setName('')
                  setPassword('')
                  setEmail('')
                }}
              >
                {isSignUp ? 'ログインに戻る' : '新規登録'}
              </Button>
            </div>

            {!isSignUp && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>テスト用アカウント:</strong></p>
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