import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Supabaseからサインアウト
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('サインアウトエラー:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=サインアウトに失敗しました', request.url))
  }

  // サインインページにリダイレクト
  return NextResponse.redirect(new URL('/auth/signin', request.url))
} 