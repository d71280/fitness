'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Home, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            アクセス権限がありません
          </h2>
          <p className="mt-4 text-sm text-gray-600">
            申し訳ございませんが、このページにアクセスする権限がありません。
            管理者機能にアクセスするには、管理者権限が必要です。
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoHome}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="h-5 w-5 mr-2" />
            ホームページに戻る
          </button>
          
          <button
            onClick={handleSignOut}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LogOut className="h-5 w-5 mr-2" />
            サインアウト
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            管理者権限が必要な場合は、システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}