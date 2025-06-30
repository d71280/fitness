import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback - Full URL:', request.url)
  console.log('Auth callback - Code:', code)
  console.log('Auth callback - Redirect to:', redirectTo)

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Auth callback - Exchange result:', { user: data?.user?.id, error: error?.message })
      
      if (!error && data.user) {
        console.log('Auth callback - Success! Redirecting to:', `${origin}${redirectTo}`)
        return NextResponse.redirect(`${origin}${redirectTo}`)
      } else {
        console.error('Auth callback - Exchange failed:', error?.message)
        return NextResponse.redirect(`${origin}/auth/signin?error=exchange-failed`)
      }
    } catch (err) {
      console.error('Auth callback - Exception:', err)
      return NextResponse.redirect(`${origin}/auth/signin?error=callback-exception`)
    }
  }

  console.log('Auth callback - No code provided')
  return NextResponse.redirect(`${origin}/auth/signin?error=no-code`)
}