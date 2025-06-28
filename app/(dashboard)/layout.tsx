'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

interface User {
  email: string
  name: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 開発環境での簡単アクセス（URLパラメーターでスキップ）
    const urlParams = new URLSearchParams(window.location.search)
    const devMode = urlParams.get('dev') === 'true'
    
    if (devMode) {
      // 開発用の仮ユーザーを設定
      const devUser = { email: 'dev@admin.com', name: '開発用管理者' }
      setUser(devUser)
      localStorage.setItem('user', JSON.stringify(devUser))
      setLoading(false)
      return
    }

    // ローカルストレージからユーザー情報を取得
    const userStr = localStorage.getItem('user')
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error('ユーザー情報の読み込みエラー:', error)
        localStorage.removeItem('user')
        router.push('/auth/supabase-signin')
      }
    } else {
      router.push('/auth/supabase-signin')
    }
    
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">認証情報を確認中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}