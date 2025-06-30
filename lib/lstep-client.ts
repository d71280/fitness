import axios from 'axios'

export interface LstepMessage {
  type: 'text' | 'flex' | 'image' | 'template'
  text?: string
  altText?: string
  flexContent?: any
  templateContent?: any
  [key: string]: any
}

export interface LstepResponse {
  success: boolean
  messageId?: string
  error?: string
  data?: any
}

export class LstepClient {
  private apiKey: string
  private apiUrl: string
  private enabled: boolean

  constructor() {
    this.apiKey = process.env.LSTEP_API_KEY || ''
    this.apiUrl = process.env.LSTEP_API_URL || 'https://api.lstep.app/v1'
    this.enabled = !!this.apiKey
    
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  LSTEP_API_KEY environment variable is not set')
    }
  }

  // Lステップ経由でメッセージ送信
  async sendMessage(lineId: string, message: LstepMessage): Promise<LstepResponse> {
    try {
      if (!this.enabled) {
        console.log('📱 Lステップ送信 (開発モード):')
        console.log(`LINE ID: ${lineId}`)
        console.log('Message:', JSON.stringify(message, null, 2))
        
        return {
          success: true,
          messageId: `mock_lstep_${Date.now()}`,
          data: { mode: 'development' }
        }
      }

      const response = await axios.post(`${this.apiUrl}/messages/send`, {
        line_id: lineId,
        message: message,
        delivery_type: 'immediate' // 即時配信
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return {
        success: true,
        messageId: response.data.message_id,
        data: response.data
      }
    } catch (error: any) {
      console.error('Lステップ送信エラー:', error)
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Lステップ送信に失敗しました'
      }
    }
  }

  // 予約確認メッセージの送信（テンプレート使用）
  async sendBookingConfirmation(lineId: string, bookingData: {
    customerName: string
    date: string
    time: string
    program: string
    instructor: string
    studio: string
    reservationId: number
  }): Promise<LstepResponse> {
    const message: LstepMessage = {
      type: 'text',
      text: `🎉 予約が完了しました！

📅 日時: ${bookingData.date} ${bookingData.time}
🏃‍♀️ プログラム: ${bookingData.program}
👨‍🏫 インストラクター: ${bookingData.instructor}
🏢 スタジオ: ${bookingData.studio}
🆔 予約ID: ${bookingData.reservationId}

${bookingData.customerName}様、お疲れ様でした！
当日お待ちしております✨

※キャンセルをご希望の場合は、クラス開始の2時間前までにご連絡ください。`
    }

    return this.sendMessage(lineId, message)
  }

  // リマインダーメッセージの送信
  async sendReminder(lineId: string, reminderData: {
    customerName: string
    date: string
    time: string
    program: string
    studio: string
    hoursUntil: number
  }): Promise<LstepResponse> {
    const message: LstepMessage = {
      type: 'text',
      text: `⏰ レッスンのリマインダー

${reminderData.customerName}様
${reminderData.hoursUntil}時間後にレッスンがあります！

📅 日時: ${reminderData.date} ${reminderData.time}
🏃‍♀️ プログラム: ${reminderData.program}
🏢 スタジオ: ${reminderData.studio}

準備はお済みですか？
お待ちしております😊`
    }

    return this.sendMessage(lineId, message)
  }

  // キャンセル確認メッセージの送信
  async sendCancellationConfirmation(lineId: string, cancellationData: {
    customerName: string
    date: string
    time: string
    program: string
    reason?: string
  }): Promise<LstepResponse> {
    const message: LstepMessage = {
      type: 'text',
      text: `❌ キャンセルが完了しました

${cancellationData.customerName}様

以下の予約をキャンセルいたしました：
📅 日時: ${cancellationData.date} ${cancellationData.time}
🏃‍♀️ プログラム: ${cancellationData.program}

またのご利用をお待ちしております🙏`
    }

    return this.sendMessage(lineId, message)
  }

  // Flexメッセージでリッチな予約確認を送信
  async sendRichBookingConfirmation(lineId: string, bookingData: {
    customerName: string
    date: string
    time: string
    program: string
    instructor: string
    studio: string
    reservationId: number
    programColor: string
  }): Promise<LstepResponse> {
    const flexContent = {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: bookingData.programColor || "#4CAF50",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "予約完了",
            weight: "bold",
            color: "#ffffff",
            size: "xl"
          },
          {
            type: "text",
            text: `${bookingData.program}`,
            weight: "bold",
            color: "#ffffff",
            size: "lg"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "日時",
                color: "#aaaaaa",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: `${bookingData.date} ${bookingData.time}`,
                wrap: true,
                color: "#666666",
                size: "sm",
                flex: 5
              }
            ]
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "インストラクター",
                color: "#aaaaaa",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: bookingData.instructor,
                wrap: true,
                color: "#666666",
                size: "sm",
                flex: 5
              }
            ]
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "スタジオ",
                color: "#aaaaaa",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: bookingData.studio,
                wrap: true,
                color: "#666666",
                size: "sm",
                flex: 5
              }
            ]
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "予約ID",
                color: "#aaaaaa",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: `#${bookingData.reservationId}`,
                wrap: true,
                color: "#666666",
                size: "sm",
                flex: 5
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `${bookingData.customerName}様、お疲れ様でした！`,
            color: "#666666",
            size: "sm",
            align: "center"
          },
          {
            type: "text",
            text: "当日お待ちしております✨",
            color: "#666666",
            size: "sm",
            align: "center"
          }
        ]
      }
    }

    const message: LstepMessage = {
      type: 'flex',
      altText: '予約完了のお知らせ',
      flexContent: flexContent
    }

    return this.sendMessage(lineId, message)
  }

  // ヘルスチェック
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.enabled) {
        return true // 開発モードでは常にOK
      }

      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      })

      return response.status === 200
    } catch (error) {
      console.error('Lステップヘルスチェックエラー:', error)
      return false
    }
  }
}

// シングルトンインスタンス
export const lstepClient = new LstepClient()