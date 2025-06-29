'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, LogOut, Bell, Menu } from 'lucide-react'

interface User {
  email: string
  name: string
}

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (error) {
        console.error('ユーザー情報の読み込みエラー:', error)
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b">
      <div className="flex items-center space-x-4">
        {/* ハンバーガーメニュー（モバイルのみ） */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <h1 className="text-lg md:text-xl font-semibold text-gray-800">
          管理画面
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* 通知 */}
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="h-5 w-5" />
        </Button>

        {/* ユーザー情報 */}
        <div className="flex items-center space-x-1 md:space-x-3">
          <div className="hidden sm:flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">
              {user?.name || 'Admin'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-1 md:gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>
    </header>
  )
}