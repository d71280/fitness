// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { LineMessagingClient } from '@/lib/line-messaging'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 LINE通知テスト開始')
    
    // 環境変数チェック
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    console.log('環境変数チェック:', {
      hasAccessToken: !!accessToken,
      tokenStart: accessToken?.substring(0, 10),
      isTestToken: accessToken === 'test_token',
      startsWithPlaceholder: accessToken?.startsWith('your_line_channel'),
      NODE_ENV: process.env.NODE_ENV,
      LINE_DEBUG_MODE: process.env.LINE_DEBUG_MODE
    })
    
    if (!accessToken || accessToken === 'test_token' || accessToken.startsWith('your_line_channel')) {
      return NextResponse.json({
        success: false,
        error: 'LINE_CHANNEL_ACCESS_TOKEN が正しく設定されていません',
        tokenInfo: {
          hasToken: !!accessToken,
          value: accessToken
        }
      })
    }
    
    // テスト用LINE ID
    const testLineId = 'U1234567890abcdef1234567890abcdef1'
    
    // LINE通知テスト送信
    try {
      const lineClient = new LineMessagingClient()
      const messageText = '🧪 LINE通知テストメッセージです！'
      
      console.log('LINE通知送信開始:', {
        lineId: testLineId,
        message: messageText
      })
      
      const lineResult = await lineClient.pushMessage(testLineId, {
        type: 'text',
        text: messageText
      })
      
      console.log('LINE通知結果:', lineResult)
      
      return NextResponse.json({
        success: true,
        message: 'LINE通知テスト完了',
        lineResult: lineResult,
        environmentCheck: {
          hasAccessToken: !!accessToken,
          tokenStart: accessToken?.substring(0, 10)
        }
      })
      
    } catch (lineError) {
      console.error('❌ LINE通知エラー:', lineError)
      return NextResponse.json({
        success: false,
        error: 'LINE通知送信に失敗しました',
        details: lineError instanceof Error ? lineError.message : 'Unknown error'
      })
    }
    
  } catch (error) {
    console.error('❌ LINE通知テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'LINE通知テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'LINE通知テストエンドポイント',
    timestamp: new Date().toISOString()
  })
}