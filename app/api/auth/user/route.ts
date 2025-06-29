import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json(
        { error: '認証エラー: ' + error.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'user',
        created_at: user.created_at
      }
    })

  } catch (error: any) {
    console.error('ユーザー取得エラー:', error)
    return NextResponse.json(
      { error: '内部サーバーエラー: ' + error.message },
      { status: 500 }
    )
  }
} 