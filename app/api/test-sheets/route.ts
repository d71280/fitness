import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Google Sheets 書き込み開始 ===')
    
    // リクエストボディから予約データを取得
    const body = await request.json()
    const reservationData = body.reservationData
    const providerToken = body.providerToken // 予約APIから送られたトークン
    
    // Supabase セッション取得
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('セッション状態:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasProviderToken: !!session?.provider_token,
      provider: session?.user?.app_metadata?.provider,
      sessionError: sessionError?.message,
      userMetadata: session?.user?.user_metadata,
      providerTokenLength: session?.provider_token?.length
    })

    // トークンを優先的に使用（予約APIから送られた場合）
    const accessToken = providerToken || session?.provider_token

    if (!accessToken) {
      console.error('アクセストークンが見つかりません:', {
        hasProviderToken: !!providerToken,
        hasSessionToken: !!session?.provider_token
      })
      return NextResponse.json({
        success: false,
        error: 'Googleアクセストークンがありません'
      }, { status: 401 })
    }
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
    
    console.log('API呼び出し準備:', {
      spreadsheetId,
      tokenPrefix: accessToken.substring(0, 10) + '...'
    })

    // OAuth トークンの詳細情報を取得
    try {
      const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json()
        console.log('OAuth トークン情報:', {
          scopes: tokenInfo.scope,
          audience: tokenInfo.audience,
          expires_in: tokenInfo.expires_in
        })
        
        // Google Sheets APIに必要なスコープをチェック
        const requiredScopes = ['https://www.googleapis.com/auth/spreadsheets']
        const hasRequiredScopes = requiredScopes.every(scope => 
          tokenInfo.scope?.includes(scope)
        )
        
        if (!hasRequiredScopes) {
          console.error('❌ 必要なスコープが不足しています')
          console.error('現在のスコープ:', tokenInfo.scope)
          console.error('必要なスコープ:', requiredScopes)
          
          return NextResponse.json({
            success: false,
            error: `OAuth トークンにGoogle Sheets APIの権限がありません。現在のスコープ: ${tokenInfo.scope}`,
            tokenInfo: tokenInfo
          }, { status: 403 })
        }
      }
    } catch (tokenCheckError) {
      console.warn('OAuth トークン情報の取得に失敗:', tokenCheckError)
    }

    // データを準備（予約データがある場合はそれを使用、なければテストデータ）
    let writeData
    if (reservationData) {
      writeData = [
        reservationData.日付,
        reservationData.名前,
        reservationData.体験日,
        reservationData.時間,
        reservationData.プログラム
      ]
      console.log('予約データを書き込み:', writeData)
    } else {
      writeData = [
        new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
        'テストユーザー',
        new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
        '10:00-11:00',
        'テストプログラム'
      ]
      console.log('テストデータを書き込み:', writeData)
    }

    // Google Sheets API 呼び出し（B5から書き込み）
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/B5:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [writeData]
        })
      }
    )

    console.log('Google Sheets API応答:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Sheets APIエラー:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Google Sheets API エラー (${response.status}): ${errorText}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      }, { status: 500 })
    }

    // レスポンスを一度だけ読み取る
    const responseText = await response.text()
    console.log('Google Sheets API生レスポンス:', responseText)
    
    let result
    try {
      result = JSON.parse(responseText)
      console.log('✅ Google Sheets 書き込み成功:', result)
    } catch (jsonError) {
      console.error('Google Sheets API応答のJSON解析エラー:', jsonError)
      console.error('応答テキスト:', responseText)
      
      return NextResponse.json({
        success: false,
        error: `Google Sheets API応答のJSON解析に失敗: ${jsonError.message}`,
        responseText: responseText
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'テストデータをスプレッドシートに書き込みました',
      result: result,
      testData: writeData
    })

  } catch (error) {
    console.error('テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}