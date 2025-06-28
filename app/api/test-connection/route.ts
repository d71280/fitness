import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
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
    if (!settings.lineChannelSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'LINEチャンネルシークレットが必要です' 
      })
    }

    // 開発環境では設定値の確認のみ
    if (process.env.NODE_ENV === 'development') {
      console.log('LINE接続テスト（開発モード）:', {
        channelSecret: settings.lineChannelSecret.substring(0, 8) + '...',
        userId: settings.lineUserId
      })
      
      // 基本的な設定値の検証
      if (settings.lineChannelSecret.length < 10) {
        return NextResponse.json({ 
          success: false, 
          error: 'チャンネルシークレットの形式が正しくありません' 
        })
      }

      if (settings.lineUserId && !settings.lineUserId.startsWith('U')) {
        return NextResponse.json({ 
          success: false, 
          error: 'ユーザーIDは"U"で始まる必要があります' 
        })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '開発モードでの接続テストが成功しました' 
      })
    }

    // 本番環境での実際のAPI呼び出し
    // LINE Messaging APIの基本的なテスト
    const response = await axios.get('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${settings.lineChannelSecret}`
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