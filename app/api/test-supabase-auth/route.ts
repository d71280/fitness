import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Supabase Auth 接続テスト開始 ===')
    
    const supabase = await createClient()
    
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('環境変数確認:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'セット済み' : '未設定')
    console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? 'セット済み' : '未設定')
    console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'セット済み' : '未設定')
    
    // 基本的な認証機能テスト
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('ユーザー一覧取得エラー:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Supabase認証サービスに接続できません',
        details: usersError.message,
        troubleshooting: [
          '1. SUPABASE_SERVICE_ROLE_KEYが正しく設定されているか確認',
          '2. Supabaseプロジェクトで認証機能が有効になっているか確認',
          '3. APIキーの権限が正しいか確認'
        ]
      }, { status: 500 })
    }
    
    // データベース接続テスト
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    return NextResponse.json({
      success: true,
      message: 'Supabase認証サービスが正常に動作しています',
      environment: {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      },
      users: {
        count: users?.length || 0,
        firstUser: users?.[0] ? {
          id: users[0].id,
          email: users[0].email,
          created_at: users[0].created_at
        } : null
      },
      database: {
        connected: !tablesError,
        tablesFound: tables?.length || 0,
        error: tablesError?.message
      }
    })
    
  } catch (error: any) {
    console.error('Supabase接続テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error.message,
      troubleshooting: [
        '1. インターネット接続を確認',
        '2. .env.localファイルの設定を確認',
        '3. Supabaseプロジェクトが実行中か確認'
      ]
    }, { status: 500 })
  }
} 