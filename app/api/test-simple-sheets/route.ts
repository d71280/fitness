import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== シンプルな Google Sheets 書き込みテスト開始 ===')
    
    // Supabase セッション取得
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      return NextResponse.json({
        success: false,
        error: 'Google認証が必要です。Googleでログインしてください。'
      }, { status: 401 })
    }

    const accessToken = session.provider_token
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
    
    console.log('認証情報:', {
      hasToken: !!accessToken,
      tokenLength: accessToken.length,
      spreadsheetId
    })

    // テストデータを準備
    const today = new Date().toLocaleDateString('ja-JP')
    const testData = [today, 'テストユーザー', today, 'テストプログラム']
    
    console.log('書き込みデータ:', testData)
    
    // 1. まずスプレッドシートの基本情報を取得してみる
    console.log('=== Step 1: スプレッドシート情報取得 ===')
    const infoResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('スプレッドシート情報API応答:', {
      status: infoResponse.status,
      statusText: infoResponse.statusText,
      ok: infoResponse.ok
    })
    
    if (!infoResponse.ok) {
      const errorText = await infoResponse.text()
      console.error('スプレッドシート情報取得エラー:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `スプレッドシートにアクセスできません (${infoResponse.status}): ${errorText}`,
        step: 'spreadsheet_info',
        details: {
          status: infoResponse.status,
          statusText: infoResponse.statusText
        }
      }, { status: 500 })
    }
    
    const spreadsheetInfo = await infoResponse.json()
    console.log('✅ スプレッドシート情報取得成功:', {
      title: spreadsheetInfo.properties?.title,
      sheetCount: spreadsheetInfo.sheets?.length
    })
    
    // 2. データを書き込む
    console.log('=== Step 2: データ書き込み ===')
    
    // B5から書き込みを開始（見出し行をスキップ）
    const writeResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/B5:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [testData]
        })
      }
    )
    
    console.log('書き込みAPI応答:', {
      status: writeResponse.status,
      statusText: writeResponse.statusText,
      ok: writeResponse.ok
    })
    
    if (!writeResponse.ok) {
      const errorText = await writeResponse.text()
      console.error('書き込みエラー:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `データ書き込みに失敗 (${writeResponse.status}): ${errorText}`,
        step: 'data_write',
        spreadsheetInfo: {
          title: spreadsheetInfo.properties?.title,
          accessible: true
        }
      }, { status: 500 })
    }
    
    const writeResult = await writeResponse.json()
    console.log('✅ データ書き込み成功:', writeResult)
    
    return NextResponse.json({
      success: true,
      message: '✅ Google Sheets書き込み成功！',
      spreadsheetInfo: {
        title: spreadsheetInfo.properties?.title,
        sheetCount: spreadsheetInfo.sheets?.length
      },
      writeResult: writeResult,
      testData: testData
    })
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return NextResponse.json({
      success: false,
      error: `予期しないエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}