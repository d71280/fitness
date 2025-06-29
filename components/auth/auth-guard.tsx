'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/signin' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 初期認証状態確認
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (requireAuth && !user) {
        router.push(redirectTo)
      }
    }

    getInitialUser()

    // 認証状態変更リスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      
      if (requireAuth && !session?.user && event === 'SIGNED_OUT') {
        router.push(redirectTo)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, requireAuth, redirectTo])

  // ローディング中
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 認証が必要で、ユーザーがログインしていない場合
  if (requireAuth && !user) {
    return null
  }

  return <>{children}</>
} 