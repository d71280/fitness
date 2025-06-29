import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、名前が必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 管理者ユーザーを作成
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('管理者ユーザー作成エラー:', authError)
      return NextResponse.json(
        { error: '管理者ユーザーの作成に失敗しました: ' + authError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '管理者ユーザーが正常に作成されました',
      user: {
        id: authUser.user?.id,
        email: authUser.user?.email,
        name: authUser.user?.user_metadata?.name
      }
    })

  } catch (error: any) {
    console.error('管理者セットアップエラー:', error)
    return NextResponse.json(
      { error: '内部サーバーエラー: ' + error.message },
      { status: 500 }
    )
  }
} 