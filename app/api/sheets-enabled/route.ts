import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // クライアントサイドの設定をチェック
    const url = new URL(request.url)
    const clientEnabled = url.searchParams.get('enabled') === 'true'
    
    // 現在は常にクライアントサイドの設定を優先
    return NextResponse.json({
      success: true,
      enabled: clientEnabled
    })
  } catch (error) {
    console.error('設定チェックエラー:', error)
    return NextResponse.json({
      success: false,
      enabled: false
    })
  }
}