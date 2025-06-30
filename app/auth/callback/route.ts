import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'
  const origin = request.nextUrl.origin

  console.log('Auth callback - Code:', code)
  console.log('Auth callback - Next:', next)
  console.log('Auth callback - Origin:', origin)

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Auth callback - Exchange result:', { data: data?.user?.id, error })
    
    if (!error) {
      console.log('Auth callback - Redirecting to:', `${origin}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth callback - Exchange error:', error)
    }
  }

  // エラーまたはコードがない場合はサインインページへリダイレクト
  console.log('Auth callback - Redirecting to signin with error')
  return NextResponse.redirect(`${origin}/auth/signin?error=auth-failed`)
}