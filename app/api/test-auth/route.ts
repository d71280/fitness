import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    console.log('=== 認証テスト開始 ===')
    console.log('Email:', email)
    
    // 新規ユーザー作成のテスト
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'テストユーザー',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('認証エラー:', authError)
      return NextResponse.json({
        success: false,
        error: authError.message,
        code: authError.status
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザー作成成功',
      user: {
        id: authUser.user?.id,
        email: authUser.user?.email,
        created_at: authUser.user?.created_at
      }
    })

  } catch (error: any) {
    console.error('認証テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 