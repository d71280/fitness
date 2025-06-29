import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== シンプル認証テスト ===')
    console.log('Email:', email)
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const supabase = await createClient()
    
    // 通常のユーザー登録（admin.createUserではなく）
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      console.error('認証エラー詳細:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          status: error.status,
          name: error.name,
          originalError: error
        }
      }, { status: 400 })
    }

    console.log('認証成功:', data.user?.id)
    
    return NextResponse.json({
      success: true,
      message: 'ユーザー登録に成功しました',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at !== null
      }
    })

  } catch (error: any) {
    console.error('予期しないエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error.message
    }, { status: 500 })
  }
} 