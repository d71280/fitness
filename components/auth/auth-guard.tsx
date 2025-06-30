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
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('AuthGuard - Initial user check:', { user: user?.id, error })
      setUser(user)
      setLoading(false)

      if (requireAuth && !user) {
        console.log('AuthGuard - Redirecting to signin, no user found')
        router.push(redirectTo)
      }
    }

    getInitialUser()

    // 認証状態変更リスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthGuard - Auth state change:', { event, user: session?.user?.id })
      setUser(session?.user ?? null)
      
      if (requireAuth && !session?.user && event === 'SIGNED_OUT') {
        console.log('AuthGuard - User signed out, redirecting')
        router.push(redirectTo)
      }
      
      if (session?.user && event === 'SIGNED_IN') {
        console.log('AuthGuard - User signed in:', session.user.id)
        // Googleログイン後にダッシュボードにいない場合はリダイレクト
        if (window.location.pathname === '/auth/signin') {
          console.log('AuthGuard - Redirecting authenticated user to dashboard')
          router.push('/dashboard')
        }
      }
      
      if (session?.user && event === 'TOKEN_REFRESHED') {
        console.log('AuthGuard - Token refreshed for user:', session.user.id)
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