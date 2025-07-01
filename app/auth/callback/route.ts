import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 動的にURLを取得
  const origin = requestUrl.origin
  
  const redirectTo = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Host:', request.headers.get('host'))
  console.log('Origin (from URL):', requestUrl.origin)
  console.log('Origin (from header):', request.headers.get('origin'))
  console.log('Protocol:', requestUrl.protocol)
  console.log('Hostname:', requestUrl.hostname)
  console.log('Port:', requestUrl.port)
  console.log('Code:', code ? 'Present' : 'Missing')
  console.log('Next param:', redirectTo)
  console.log('All search params:', Object.fromEntries(requestUrl.searchParams))

  if (code) {
    try {
      const supabase = await createClient()
      console.log('Supabase client created successfully')
      console.log('Attempting to exchange code for session...')
      
      // PKCE verifierを明示的に処理
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Exchange result:')
      console.log('- User ID:', data?.user?.id)
      console.log('- User email:', data?.user?.email)
      console.log('- Session exists:', !!data?.session)
      console.log('- Session access token:', !!data?.session?.access_token)
      console.log('- Session refresh token:', !!data?.session?.refresh_token)
      console.log('- Error:', error?.message)
      console.log('- Error details:', error)
      
      if (!error && data.user && data.session) {
        console.log('AUTH SUCCESS - User and session confirmed')
        console.log('Session details:', {
          userId: data.user.id,
          email: data.user.email,
          accessToken: !!data.session.access_token,
          refreshToken: !!data.session.refresh_token,
          expiresIn: data.session.expires_in
        })
        
        // セッション確立を複数回確認
        let sessionVerified = false
        let verificationAttempts = 0
        const maxAttempts = 3
        
        while (!sessionVerified && verificationAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const { data: userCheck } = await supabase.auth.getUser()
          if (userCheck.user) {
            sessionVerified = true
            console.log('Session verified after', verificationAttempts + 1, 'attempts')
          } else {
            verificationAttempts++
            console.log('Session verification attempt', verificationAttempts, 'failed, retrying...')
          }
        }
        
        if (!sessionVerified) {
          console.error('Session verification failed after all attempts')
          const errorUrl = `${origin}/auth/signin?error=session-verification-timeout`
          return NextResponse.redirect(errorUrl)
        }
        
        // 中間認証確認ページにリダイレクト（セッション確立を確実にするため）
        const successUrl = `${origin}/auth/verify-session?next=${encodeURIComponent(redirectTo)}`
        console.log('SUCCESS! Redirecting to session verification:', successUrl)
        console.log('=== END AUTH CALLBACK DEBUG ===')
        
        const response = NextResponse.redirect(successUrl)
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        return response
      } else {
        console.error('Exchange failed:', error?.message)
        const errorUrl = `${origin}/auth/signin?error=exchange-failed`
        console.log('ERROR redirect URL:', errorUrl)
        console.log('=== END AUTH CALLBACK DEBUG ===')
        return NextResponse.redirect(errorUrl)
      }
    } catch (err) {
      console.error('Exception during exchange:', err)
      console.error('Exception details:', {
        name: (err as Error)?.name,
        message: (err as Error)?.message,
        stack: (err as Error)?.stack
      })
      
      let errorParam = 'callback-exception'
      if ((err as Error)?.message?.includes('timeout')) {
        errorParam = 'timeout-error'
      } else if ((err as Error)?.message?.includes('network')) {
        errorParam = 'network-error'
      }
      
      const errorUrl = `${origin}/auth/signin?error=${errorParam}`
      console.log('EXCEPTION redirect URL:', errorUrl)
      console.log('=== END AUTH CALLBACK DEBUG ===')
      return NextResponse.redirect(errorUrl)
    }
  }

  console.log('No code provided in callback')
  const errorUrl = `${origin}/auth/signin?error=no-code`
  console.log('NO-CODE redirect URL:', errorUrl)
  console.log('=== END AUTH CALLBACK DEBUG ===')
  return NextResponse.redirect(errorUrl)
}