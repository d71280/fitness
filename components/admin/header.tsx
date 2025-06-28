'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, LogOut, Bell } from 'lucide-react'

interface User {
  email: string
  name: string
}

export function AdminHeader() {
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
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">
          管理画面
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* 通知 */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        {/* ユーザー情報 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">
              {user?.name || 'Admin'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}