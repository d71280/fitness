import axios from 'axios'
import { LineMessagingClient, LineMessage } from './line-messaging'
import { getMessageSettings, processMessageTemplate } from './message-templates'

export interface BookingData {
  id: number
  date: string
  time: string
  program: string
  instructor: string
  studio: string
  customerName: string
}

export interface ReminderData {
  program: string
  date: string
  time: string
  instructor: string
  studio: string
}

export interface WaitingListData {
  program: string
  date: string
  time: string
  studio: string
}

export class LStepClient {
  private channelId: string

  constructor() {
    this.channelId = process.env.LSTEP_CHANNEL_ID!
  }

  // 予約完了通知（LINE Messaging API経由）
  async sendBookingConfirmation(lineId: string, bookingData: BookingData) {
    const messageSettings = getMessageSettings()
    
    if (!messageSettings.bookingConfirmation.enabled) {
      return { success: true, message: 'メッセージ送信は無効化されています' }
    }

    let message: any

    if (messageSettings.bookingConfirmation.messageType === 'text') {
      // テキストメッセージの場合
      const processedText = processMessageTemplate(
        messageSettings.bookingConfirmation.textMessage,
        bookingData
      )
      
      message = {
        type: 'text',
        text: processedText
      }
    } else {
      // Flexメッセージの場合（既存の実装を使用）
      const flexContents = []
      const details = messageSettings.bookingConfirmation.includeDetails

      if (details.program) {
        flexContents.push({
          type: 'text',
          text: bookingData.program,
          weight: 'bold',
          size: 'xl',
          color: '#333333'
        })
      }

      const detailsBox = []
      if (details.date) {
        detailsBox.push({
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          contents: [
            { type: 'text', text: '📅', flex: 1 },
            { type: 'text', text: bookingData.date, flex: 4, color: '#666666' }
          ]
        })
      }
      if (details.time) {
        detailsBox.push({
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          contents: [
            { type: 'text', text: '⏰', flex: 1 },
            { type: 'text', text: bookingData.time, flex: 4, color: '#666666' }
          ]
        })
      }
      if (details.instructor) {
        detailsBox.push({
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          contents: [
            { type: 'text', text: '👨‍🏫', flex: 1 },
            { type: 'text', text: bookingData.instructor, flex: 4, color: '#666666' }
          ]
        })
      }
      if (details.studio) {
        detailsBox.push({
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          contents: [
            { type: 'text', text: '🏢', flex: 1 },
            { type: 'text', text: bookingData.studio, flex: 4, color: '#666666' }
          ]
        })
      }

      if (detailsBox.length > 0) {
        flexContents.push({
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: detailsBox
        })
      }

      message = {
        type: 'flex',
        altText: '予約完了のお知らせ',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'text',
              text: '✅ 予約完了',
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
            spacing: 'md',
            contents: flexContents
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'マイページで確認',
                  uri: `${process.env.APP_BASE_URL}/mypage?booking=${bookingData.id}`
                },
                style: 'primary',
                color: '#06C755'
              },
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: 'キャンセル',
                  data: `cancel_booking_${bookingData.id}`
                },
                style: 'secondary'
              }
            ]
          }
        }
      }
    }

    // LINE Messaging API経由で送信
    const lineClient = new LineMessagingClient()
    return await lineClient.pushMessage(lineId, message)
  }

  // リマインダー通知
  async sendReminder(lineId: string, reminderData: ReminderData) {
    const message: LineMessage = {
      type: 'text',
      text: `【明日のレッスンのお知らせ】\n\n${reminderData.program}\n📅 ${reminderData.date}\n⏰ ${reminderData.time}\n👨‍🏫 ${reminderData.instructor}\n🏢 ${reminderData.studio}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊`
    }

    // LINE Messaging API経由で送信
    const lineClient = new LineMessagingClient()
    return await lineClient.pushMessage(lineId, message)
  }

  // キャンセル待ち空き通知
  async sendWaitingListNotification(lineId: string, waitingData: WaitingListData) {
    const message: LineMessage = {
      type: 'flex',
      altText: 'キャンセル待ちのお知らせ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '🎉 空きが出ました！',
            weight: 'bold',
            color: '#ffffff'
          }],
          backgroundColor: '#FF6B35',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'キャンセル待ちのクラスに空きが出ました！',
              wrap: true,
              color: '#333333'
            },
            {
              type: 'text',
              text: waitingData.program,
              weight: 'bold',
              size: 'lg',
              margin: 'md',
              color: '#333333'
            },
            {
              type: 'text',
              text: `${waitingData.date} ${waitingData.time}`,
              color: '#666666'
            },
            {
              type: 'text',
              text: waitingData.studio,
              color: '#666666'
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
              label: '今すぐ予約する',
              uri: `${process.env.APP_BASE_URL}/schedule`
            },
            style: 'primary',
            color: '#FF6B35'
          }]
        }
      }
    }

    // LINE Messaging API経由で送信
    const lineClient = new LineMessagingClient()
    return await lineClient.pushMessage(lineId, message)
  }

  // 新スケジュール追加通知
  async sendNewScheduleNotification(lineIds: string[], scheduleData: any) {
    const message: LineMessage = {
      type: 'flex',
      altText: '新しいクラスのお知らせ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '🆕 新しいクラス',
            weight: 'bold',
            color: '#ffffff'
          }],
          backgroundColor: '#0084FF',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '新しいクラスが追加されました！',
              wrap: true,
              color: '#333333'
            },
            {
              type: 'text',
              text: scheduleData.program,
              weight: 'bold',
              size: 'lg',
              margin: 'md',
              color: '#333333'
            },
            {
              type: 'text',
              text: `${scheduleData.date} ${scheduleData.time}`,
              color: '#666666'
            },
            {
              type: 'text',
              text: `${scheduleData.instructor} | ${scheduleData.studio}`,
              color: '#666666'
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
              label: '予約する',
              uri: `${process.env.APP_BASE_URL}/schedule`
            },
            style: 'primary',
            color: '#0084FF'
          }]
        }
      }
    }

    // 複数のユーザーに送信（LINE Messaging API経由）
    const lineClient = new LineMessagingClient()
    
    // マルチキャスト送信（最大500件まで）
    if (lineIds.length <= 500) {
      return await lineClient.multicastMessage(lineIds, message)
    } else {
      // 500件を超える場合は分割送信
      const results = []
      for (let i = 0; i < lineIds.length; i += 500) {
        const batch = lineIds.slice(i, i + 500)
        const result = await lineClient.multicastMessage(batch, message)
        results.push({ batch: i / 500 + 1, result })
      }
      return results
    }
  }

  // GAS経由で通知送信（オプション）
  async sendNotificationViaGAS(lineId: string, bookingData: BookingData) {
    try {
      const response = await fetch(process.env.GAS_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'booking_confirmation',
          lineId: lineId,
          data: bookingData
        })
      })

      if (!response.ok) {
        throw new Error(`GAS通知送信失敗: ${response.status}`)
      }

      return { success: true, data: await response.json() }
    } catch (error) {
      console.error('GAS経由通知送信エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 通知ログを記録
  async logNotification(customerId: number, reservationId: number | null, type: string, content: any, result: any) {
    try {
      // データベースが利用可能な場合のみログを記録
      try {
        const { prisma } = await import('@/lib/prisma')
        
        await prisma.notificationLog.create({
          data: {
            customer_id: customerId,
            reservation_id: reservationId,
            notification_type: type,
            message_content: content,
            sent_at: new Date(),
            lstep_response: result.data || null,
            success: result.success,
            error_message: result.error || null,
          },
        })
      } catch (dbError) {
        console.warn('通知ログの記録をスキップします:', dbError)
      }
    } catch (error) {
      console.error('通知ログ記録エラー:', error)
    }
  }
}