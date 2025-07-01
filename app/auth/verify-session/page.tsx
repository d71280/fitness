'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function VerifySessionPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        console.log('VerifySession - Starting verification...')
        
        // クライアントサイドでセッション確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('VerifySession - Session check:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: sessionError?.message 
        })
        
        if (session?.user) {
          // セッションが確認できた場合、次のページにリダイレクト
          const urlParams = new URLSearchParams(window.location.search)
          const next = urlParams.get('next') || '/dashboard'
          
          console.log('VerifySession - Session verified, redirecting to:', next)
          
          // 少し待ってからリダイレクト（UIの安定性のため）
          await new Promise(resolve => setTimeout(resolve, 500))
          
          router.push(next)
          return
        }
        
        // セッションがない場合、再度取得を試行
        console.log('VerifySession - No session found, attempting refresh...')
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('VerifySession - User check:', { 
          hasUser: !!user, 
          error: userError?.message 
        })
        
        if (user) {
          const urlParams = new URLSearchParams(window.location.search)
          const next = urlParams.get('next') || '/dashboard'
          
          console.log('VerifySession - User verified, redirecting to:', next)
          router.push(next)
          return
        }
        
        // それでもセッションが確認できない場合はエラーページへ
        console.error('VerifySession - No valid session found')
        router.push('/auth/signin?error=session-not-found')
        
      } catch (error) {
        console.error('VerifySession - Error during verification:', error)
        router.push('/auth/signin?error=verification-error')
      }
    }
    
    verifyAndRedirect()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-medium text-gray-900 mb-2">認証確認中...</h1>
        <p className="text-gray-600">セッションを確認しています。少々お待ちください。</p>
      </div>
    </div>
  )
}