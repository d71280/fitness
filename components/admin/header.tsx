'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('サインアウトエラー:', error)
      } else {
        router.push('/auth/signin')
        router.refresh()
      }
    } catch (error) {
      console.error('サインアウト処理エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* ハンバーガーメニューボタン（モバイル用） */}
          <div className="flex items-center lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="text-gray-500 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* タイトル */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              フィットネス予約管理システム
            </h1>
            <h1 className="text-lg font-semibold text-gray-900 sm:hidden">
              管理画面
            </h1>
          </div>

          {/* ユーザー情報とサインアウトボタン */}
          <div className="flex items-center space-x-3">
            {/* デスクトップ用：詳細なユーザー情報 */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  {user?.user_metadata?.name || user?.email || 'ユーザー'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{loading ? 'サインアウト中...' : 'サインアウト'}</span>
              </Button>
            </div>

            {/* モバイル用：簡略化されたサインアウトボタン */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={loading}
                className="text-gray-500 hover:text-gray-600"
                title="サインアウト"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}