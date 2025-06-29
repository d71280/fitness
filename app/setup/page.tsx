'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, User, Mail, Lock } from 'lucide-react'

export default function SetupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setMessage('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage('管理者アカウントが正常に作成されました。ログインページに移動します...')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setMessage(data.error || '管理者アカウントの作成に失敗しました')
      }
    } catch (error) {
      setMessage('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            初期セットアップ
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            システム管理者アカウントを作成してください
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">管理者名</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="管理者名を入力"
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="admin@example.com"
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="パスワードを入力（6文字以上）"
                  minLength={6}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  placeholder="パスワードを再入力"
                  minLength={6}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {message && (
              <div className={`flex items-center space-x-2 p-3 rounded-md border ${
                success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <p className={`text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>
                  {message}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '作成中...' : '管理者アカウント作成'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push('/auth/signin')}
                disabled={loading}
                className="text-sm"
              >
                既にアカウントをお持ちの場合はログイン
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 