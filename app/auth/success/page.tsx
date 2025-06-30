'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthSuccessPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        console.log('AuthSuccess - Verifying session...')
        
        // セッション確認を数回試行
        let attempts = 0
        const maxAttempts = 5
        let userVerified = false
        
        while (attempts < maxAttempts && !userVerified) {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            console.log('AuthSuccess - User verified:', user.id)
            userVerified = true
            
            // URLパラメータから次のページを取得
            const urlParams = new URLSearchParams(window.location.search)
            const next = urlParams.get('next') || '/dashboard'
            
            console.log('AuthSuccess - Redirecting to:', next)
            router.push(next)
            return
          }
          
          attempts++
          console.log(`AuthSuccess - Attempt ${attempts}/${maxAttempts} - User not found, retrying...`)
          
          // 500ms待機
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // 最大試行回数に達した場合
        console.error('AuthSuccess - Failed to verify user after', maxAttempts, 'attempts')
        router.push('/auth/signin?error=session-verification-failed')
        
      } catch (error) {
        console.error('AuthSuccess - Error during verification:', error)
        router.push('/auth/signin?error=auth-verification-error')
      }
    }
    
    verifyAndRedirect()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-medium text-gray-900 mb-2">認証中...</h1>
        <p className="text-gray-600">ログイン処理を完了しています。少々お待ちください。</p>
      </div>
    </div>
  )
}