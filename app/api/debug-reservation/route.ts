import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: 予約時の認証状態を詳細調査 ===')
    
    // 1. Supabaseサーバーサイドセッション確認
    const supabase = await createClient()
    const { data: { session: serverSession }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('サーバーサイドセッション:', {
      hasSession: !!serverSession,
      hasProviderToken: !!serverSession?.provider_token,
      tokenLength: serverSession?.provider_token?.length,
      tokenStart: serverSession?.provider_token?.substring(0, 20) + '...',
      sessionError: sessionError?.message
    })
    
    // 2. リクエストヘッダー確認
    const headerToken = request.headers.get('X-Provider-Token')
    console.log('リクエストヘッダートークン:', {
      hasHeaderToken: !!headerToken,
      tokenLength: headerToken?.length,
      tokenStart: headerToken?.substring(0, 20) + '...'
    })
    
    // 3. 使用するトークンを決定（実際の予約APIと同じロジック）
    let providerToken = serverSession?.provider_token
    if (!providerToken) {
      providerToken = headerToken || ''
    }
    
    console.log('最終的に使用するトークン:', {
      hasToken: !!providerToken,
      tokenLength: providerToken?.length,
      tokenSource: serverSession?.provider_token ? 'supabase-session' : 'request-header'
    })
    
    // 4. Google Sheets APIテスト
    if (providerToken) {
      const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
      
      try {
        console.log('=== Google Sheets API接続テスト ===')
        const infoResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
          {
            headers: {
              'Authorization': `Bearer ${providerToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log('Google Sheets API応答:', {
          status: infoResponse.status,
          statusText: infoResponse.statusText,
          ok: infoResponse.ok
        })
        
        if (infoResponse.ok) {
          const info = await infoResponse.json()
          console.log('✅ スプレッドシート接続成功:', {
            title: info.properties?.title,
            sheetCount: info.sheets?.length
          })
        } else {
          const errorText = await infoResponse.text()
          console.error('❌ スプレッドシート接続失敗:', errorText)
        }
      } catch (apiError) {
        console.error('❌ Google Sheets API呼び出しエラー:', apiError)
      }
    } else {
      console.error('❌ 有効なOAuthトークンがありません')
    }
    
    return NextResponse.json({
      debug: {
        serverSession: {
          hasSession: !!serverSession,
          hasProviderToken: !!serverSession?.provider_token,
          tokenLength: serverSession?.provider_token?.length
        },
        headerToken: {
          hasHeaderToken: !!headerToken,
          tokenLength: headerToken?.length
        },
        finalToken: {
          hasToken: !!providerToken,
          tokenLength: providerToken?.length,
          tokenSource: serverSession?.provider_token ? 'supabase-session' : 'request-header'
        }
      }
    })
    
  } catch (error) {
    console.error('❌ デバッグAPIエラー:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}