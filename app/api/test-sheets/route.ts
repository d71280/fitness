import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Google Sheets 書き込み開始 ===')
    
    // リクエストボディから予約データを取得
    const body = await request.json()
    const reservationData = body.reservationData
    
    // Supabase セッション取得
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('セッション状態:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasProviderToken: !!session?.provider_token,
      provider: session?.user?.app_metadata?.provider,
      sessionError: sessionError?.message
    })

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'セッションが見つかりません'
      }, { status: 401 })
    }

    if (!session.provider_token) {
      return NextResponse.json({
        success: false,
        error: 'Googleアクセストークンがありません'
      }, { status: 401 })
    }

    const accessToken = session.provider_token
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
    
    console.log('API呼び出し準備:', {
      spreadsheetId,
      tokenPrefix: accessToken.substring(0, 10) + '...'
    })

    // データを準備（予約データがある場合はそれを使用、なければテストデータ）
    let writeData
    if (reservationData) {
      writeData = [
        reservationData.日付,
        reservationData.名前,
        reservationData.体験日,
        reservationData.プログラム
      ]
      console.log('予約データを書き込み:', writeData)
    } else {
      writeData = [
        new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
        'テストユーザー',
        new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
        'テストプログラム'
      ]
      console.log('テストデータを書き込み:', writeData)
    }

    // Google Sheets API 呼び出し
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:D:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
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

    const result = await response.json()
    console.log('✅ Google Sheets 書き込み成功:', result)

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