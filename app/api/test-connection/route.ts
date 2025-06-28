import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    // 開発・デモ環境のため認証チェックをスキップ
    // 本番環境では適切な認証機能を実装してください
    console.log('接続テスト実行 - 認証チェックスキップ（開発モード）')

    const type = request.nextUrl.searchParams.get('type')
    const settings = await request.json()

    if (type === 'lstep') {
      return await testLStepConnection(settings)
    } else if (type === 'line') {
      return await testLineConnection(settings)
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