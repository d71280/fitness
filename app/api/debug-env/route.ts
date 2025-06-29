import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('=== 環境変数デバッグ ===')
    console.log('SUPABASE_URL:', supabaseUrl)
    console.log('ANON_KEY:', supabaseAnonKey?.substring(0, 20) + '...')
    console.log('SERVICE_KEY:', supabaseServiceKey?.substring(0, 20) + '...')
    
    return NextResponse.json({
      environment: {
        supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        urlContainsCorrectProject: supabaseUrl?.includes('qalbwnylptlzofqxjgps'),
        currentProjectInUrl: supabaseUrl?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]
      },
      status: 'debug-info',
      expectedProjectId: 'qalbwnylptlzofqxjgps',
      troubleshooting: {
        step1: '環境変数ファイルの確認',
        step2: '開発サーバーの再起動',
        step3: 'ブラウザキャッシュのクリア'
      }
    })
    
  } catch (error: any) {
    console.error('環境変数デバッグエラー:', error)
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 })
  }
} 