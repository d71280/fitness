import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
    const supabase = await createClient()

    try {
      console.log('Attempting to exchange code for session...')
      
      // より安全なコード交換のためにタイムアウトを設定
      const exchangePromise = supabase.auth.exchangeCodeForSession(code)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Exchange timeout')), 10000)
      )
      
      const { data, error } = await Promise.race([exchangePromise, timeoutPromise]) as any
      
      console.log('Exchange result:')
      console.log('- User ID:', data?.user?.id)
      console.log('- User email:', data?.user?.email)
      console.log('- Error:', error?.message)
      console.log('- Session exists:', !!data?.session)
      
      if (!error && data.user) {
        const finalUrl = `${origin}${redirectTo}`
        console.log('SUCCESS! Final redirect URL:', finalUrl)
        console.log('=== END AUTH CALLBACK DEBUG ===')
        return NextResponse.redirect(finalUrl)
      } else {
        console.error('Exchange failed:', error?.message)
        const errorUrl = `${origin}/auth/signin?error=exchange-failed`
        console.log('ERROR redirect URL:', errorUrl)
        console.log('=== END AUTH CALLBACK DEBUG ===')
        return NextResponse.redirect(errorUrl)
      }
    } catch (err) {
      console.error('Exception during exchange:', err)
      const errorUrl = `${origin}/auth/signin?error=callback-exception`
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