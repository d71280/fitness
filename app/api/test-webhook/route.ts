import { NextRequest, NextResponse } from 'next/server'

// webhook動作テスト用エンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🧪 テストWebhook受信:')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    console.log('Body:', JSON.stringify(body, null, 2))
    
    // LINEのWebhookイベント形式をシミュレート
    const testEvent = {
      type: 'message',
      source: {
        userId: 'test_user_123'
      },
      message: {
        type: 'text',
        text: '予約'
      },
      replyToken: 'test_reply_token_123'
    }
    
    // 実際のwebhook処理を呼び出し
    const webhookResponse = await fetch(`${process.env.APP_BASE_URL}/api/webhook/lstep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: [testEvent]
      })
    })
    
    const result = await webhookResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'テストWebhook処理完了',
      receivedData: body,
      testEvent: testEvent,
      webhookResult: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('テストWebhookエラー:', error)
    return NextResponse.json(
      { 
        error: 'テストWebhook処理失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET でもテスト可能
export async function GET() {
  return NextResponse.json({
    message: 'Webhook テストエンドポイント',
    usage: 'POST /api/test-webhook with JSON body',
    environment: process.env.NODE_ENV,
    appBaseUrl: process.env.APP_BASE_URL
  })
} 