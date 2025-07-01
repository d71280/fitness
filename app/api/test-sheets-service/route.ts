import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Google Sheets サービスアカウント書き込みテスト開始 ===')
    
    // リクエストボディから予約データを取得
    const body = await request.json()
    const reservationData = body.reservationData
    
    // サービスアカウント認証情報の確認
    const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY
    const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
    
    console.log('環境変数チェック:', {
      hasPrivateKey: !!googlePrivateKey,
      hasClientEmail: !!googleClientEmail,
      spreadsheetId,
      privateKeyPrefix: googlePrivateKey?.substring(0, 50) + '...'
    })
    
    if (!googlePrivateKey || !googleClientEmail) {
      return NextResponse.json({
        success: false,
        error: 'サービスアカウントの認証情報が設定されていません。GOOGLE_PRIVATE_KEY と GOOGLE_CLIENT_EMAIL を設定してください。',
        hasPrivateKey: !!googlePrivateKey,
        hasClientEmail: !!googleClientEmail
      }, { status: 400 })
    }
    
    // Google認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        private_key: googlePrivateKey.replace(/\\n/g, '\n'),
        client_email: googleClientEmail,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    console.log('Google認証設定完了')
    
    // Google Sheets APIクライアント作成
    const sheets = google.sheets({ version: 'v4', auth })
    
    // データを準備
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
        'テストユーザー（サービスアカウント）',
        new Date().toLocaleDateString('ja-JP').replace(/\//g, '/'),
        'テストプログラム'
      ]
      console.log('テストデータを書き込み:', writeData)
    }
    
    // スプレッドシートに書き込み
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A1:D1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [writeData]
      }
    })
    
    console.log('✅ Google Sheets 書き込み成功:', result.data)
    
    return NextResponse.json({
      success: true,
      message: 'サービスアカウントでスプレッドシートに書き込みました',
      result: result.data,
      testData: writeData
    })
    
  } catch (error) {
    console.error('サービスアカウント書き込みエラー:', error)
    
    if (error.code === 403) {
      return NextResponse.json({
        success: false,
        error: 'スプレッドシートへのアクセス権限がありません。サービスアカウントにスプレッドシートの編集権限を与えてください。',
        details: error.message
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}