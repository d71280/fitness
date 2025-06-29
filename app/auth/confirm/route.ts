import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const origin = request.nextUrl.origin

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    
    if (!error) {
      // 認証成功、ダッシュボードにリダイレクト
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーまたは無効なトークンの場合はエラーページにリダイレクト
  return NextResponse.redirect(`${origin}/error`)
} 