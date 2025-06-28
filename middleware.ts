import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabaseの設定が不完全な場合はmiddlewareをスキップ
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL === "your_supabase_project_url" ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your_supabase_anon_key") {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 認証トークンの更新
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 管理者ページの保護
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      // ログインしていない場合はサインインページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = '/auth/supabase-signin'
      url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // 一時的に無効化（Supabase設定完了まで）
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}