import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { GoogleSheetsClient } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    // 開発・デモ環境のため認証チェックをスキップ
    // 本番環境では適切な認証機能を実装してください
    console.log('接続テスト実行 - 認証チェックスキップ（開発モード）')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const settings = await request.json()

    if (type === 'lstep') {
      return await testLStepConnection(settings)
    } else if (type === 'line') {
      return await testLineConnection(settings)
    } else if (type === 'googlesheets') {
      return await testGoogleSheetsConnection(settings)
    } else if (type === 'groupline') {
      return await testGroupLineConnection(settings)
    } else {
      return NextResponse.json({ error: 'テストタイプが不正です' }, { status: 400 })
    }
  } catch (error) {
    console.error('接続テストエラー:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '接続テストに失敗しました' 
    })
  }
}

async function testLStepConnection(settings: any) {
  try {
    if (!settings.lstepApiKey || !settings.lstepChannelId) {
      return NextResponse.json({ 
        success: false, 
        error: 'LステップのAPIキーとチャンネルIDが必要です' 
      })
    }

    // Lステップの基本的なAPI呼び出しをテスト
    // 実際のエンドポイントは公式ドキュメントを参照
    const testMessage = {
      channelId: settings.lstepChannelId,
      messages: [{
        type: 'text',
        text: '接続テスト'
      }]
    }

    // 開発環境では実際のAPIを呼ばずに成功を返す
    if (process.env.NODE_ENV === 'development') {
      console.log('Lステップ接続テスト（開発モード）:', {
        apiKey: settings.lstepApiKey.substring(0, 8) + '...',
        channelId: settings.lstepChannelId,
        webhookUrl: settings.lstepWebhookUrl
      })
      
      return NextResponse.json({ 
        success: true, 
        message: '開発モードでの接続テストが成功しました' 
      })
    }

    // 本番環境での実際のAPI呼び出し
    const response = await axios.post('https://api.linestep.jp/v1/test', testMessage, {
      headers: {
        'Authorization': `Bearer ${settings.lstepApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Lステップ接続テストが成功しました',
      data: response.data 
    })
  } catch (error) {
    console.error('Lステップ接続テストエラー:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Lステップ接続テストに失敗しました' 
    })
  }
}

async function testLineConnection(settings: any) {
  try {
    if (!settings.lineChannelAccessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'LINEチャンネルアクセストークンが必要です' 
      })
    }

    console.log('LINE接続テスト開始:', {
      hasAccessToken: !!settings.lineChannelAccessToken,
      hasChannelSecret: !!settings.lineChannelSecret,
      tokenPrefix: settings.lineChannelAccessToken.substring(0, 8) + '...'
    })

    // 基本的な設定値の検証
    if (settings.lineChannelAccessToken.length < 20) {
      return NextResponse.json({ 
        success: false, 
        error: 'チャンネルアクセストークンの形式が正しくありません' 
      })
    }

    // 開発環境では設定値の確認のみ
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: true, 
        message: '開発モードでの接続テストが成功しました' 
      })
    }

    // 本番環境での実際のAPI呼び出し
    // LINE Messaging APIの基本的なテスト
    const response = await axios.get('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${settings.lineChannelAccessToken}`
      },
      timeout: 10000
    })

    return NextResponse.json({ 
      success: true, 
      message: 'LINE接続テストが成功しました',
      data: response.data 
    })
  } catch (error) {
    console.error('LINE接続テストエラー:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'LINE接続テストに失敗しました' 
    })
  }
}

// Google Sheets接続テスト
async function testGoogleSheetsConnection(settings: any) {
  try {
    // 環境変数を一時的に設定
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = settings.serviceAccountEmail
    process.env.GOOGLE_PRIVATE_KEY = settings.privateKey
    process.env.GOOGLE_SPREADSHEET_ID = settings.spreadsheetId

    const sheetsClient = new GoogleSheetsClient()
    const result = await sheetsClient.testConnection()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        spreadsheetTitle: result.spreadsheetTitle,
        sheetCount: result.sheetCount,
        spreadsheetId: result.spreadsheetId,
        message: 'Google Sheets接続成功'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      })
    }
  } catch (error) {
    console.error('Google Sheets接続テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Sheets接続テスト失敗'
    })
  }
}

// グループLINE通知テスト
async function testGroupLineConnection(settings: any) {
  try {
    const testMessage = {
      type: 'text',
      text: '🧪 テスト通知\n\nグループLINE通知のテストメッセージです。\n\n送信時刻: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    }

    const response = await axios.post('https://api.line.me/v2/bot/message/push', {
      to: process.env.LINE_GROUP_ID || settings.lineGroupId, // グループIDが必要
      messages: [testMessage]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.lineGroupToken}`
      }
    })

    if (response.status === 200) {
      return NextResponse.json({
        success: true,
        message: 'グループLINE通知テスト送信成功'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      })
    }
  } catch (error) {
    console.error('グループLINE通知テストエラー:', error)
    
    let errorMessage = 'グループLINE通知テスト失敗'
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `LINE API エラー: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'LINE APIへの接続エラー'
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    })
  }
}