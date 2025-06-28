import { NextRequest, NextResponse } from 'next/server'
import { LineMessagingClient } from '@/lib/line-messaging'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('LステップWebhook受信:', JSON.stringify(body, null, 2))

    // LステップからのWebhookイベントを処理
    const events = body.events || []
    
    for (const event of events) {
      await handleLStepEvent(event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LステップWebhookエラー:', error)
    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    )
  }
}

async function handleLStepEvent(event: any) {
  try {
    // イベントタイプに応じて処理を分岐
    switch (event.type) {
      case 'message':
        await handleMessageEvent(event)
        break
      case 'follow':
        await handleFollowEvent(event)
        break
      case 'postback':
        await handlePostbackEvent(event)
        break
      default:
        console.log('未対応のイベントタイプ:', event.type)
    }
  } catch (error) {
    console.error('イベント処理エラー:', error)
  }
}

async function handleMessageEvent(event: any) {
  const { source, message, replyToken } = event
  const userId = source.userId

  // メッセージタイプに応じて処理
  if (message.type === 'text') {
    const userMessage = message.text

    // 特定のキーワードに応答
    if (userMessage.includes('予約') || userMessage.includes('スケジュール')) {
      const lineClient = new LineMessagingClient()
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `スケジュールを確認するには下記のURLからアクセスしてください：\n${process.env.APP_BASE_URL}/schedule?line_id=${userId}`
      })
    }
  }
}

async function handleFollowEvent(event: any) {
  const { source, replyToken } = event
  const userId = source.userId

  // 友だち追加時のウェルカムメッセージ
  const lineClient = new LineMessagingClient()
  await lineClient.replyMessage(replyToken, {
    type: 'flex',
    altText: 'フィットネススタジオへようこそ！',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '🎉 ようこそ！',
          weight: 'bold',
          color: '#ffffff',
          size: 'lg'
        }],
        backgroundColor: '#06C755',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'フィットネススタジオの公式LINEです！',
            weight: 'bold',
            size: 'xl',
            color: '#333333'
          },
          {
            type: 'text',
            text: 'レッスンの予約やスケジュール確認ができます。',
            color: '#666666',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: 'スケジュールを見る',
            uri: `${process.env.APP_BASE_URL}/schedule?line_id=${userId}`
          },
          style: 'primary',
          color: '#06C755'
        }]
      }
    }
  })
}

async function handlePostbackEvent(event: any) {
  const { source, postback, replyToken } = event
  const userId = source.userId
  const data = postback.data

  // ポストバックデータに応じて処理
  if (data.startsWith('cancel_booking_')) {
    const bookingId = data.replace('cancel_booking_', '')
    
    // 予約キャンセル処理
    try {
      const response = await fetch(`${process.env.APP_BASE_URL}/api/reservations/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      const lineClient = new LineMessagingClient()
      if (response.ok) {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: '予約をキャンセルしました。またのご利用をお待ちしております。'
        })
      } else {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: '予約のキャンセルに失敗しました。お手数ですが、直接お問い合わせください。'
        })
      }
    } catch (error) {
      console.error('予約キャンセルエラー:', error)
    }
  }
}