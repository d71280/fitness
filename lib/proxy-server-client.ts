import axios from 'axios'

export interface ProxyMessage {
  type: 'booking_completion' | 'reminder' | 'cancellation'
  lineId: string
  customerName: string
  reservationId: number
  messageContent: string
  bookingData?: {
    date: string
    time: string
    program: string
    instructor: string
    studio: string
  }
  reminderData?: {
    hoursUntil: number
    reminderType: string
  }
  timestamp: string
}

export interface ProxyResponse {
  success: boolean
  messageId?: string
  error?: string
  data?: any
}

export class ProxyServerClient {
  private apiUrl: string
  private apiKey: string
  private enabled: boolean

  constructor() {
    this.apiUrl = process.env.PROXY_SERVER_URL || ''
    this.apiKey = process.env.PROXY_SERVER_API_KEY || ''
    this.enabled = !!this.apiUrl // API キーは必須ではない
    
    if (!this.enabled && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ PROXY_SERVER_URL environment variable is not set')
    }
  }

  // プロキシサーバーにメッセージを送信
  async sendMessage(message: ProxyMessage): Promise<ProxyResponse> {
    try {
      if (!this.enabled) {
        console.log('📡 プロキシサーバー送信 (開発モード):')
        console.log('Message:', JSON.stringify(message, null, 2))
        
        return {
          success: true,
          messageId: `mock_proxy_${Date.now()}`,
          data: { mode: 'development' }
        }
      }

      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'FitnessBookingSystem/1.0'
      }
      
      // APIキーが設定されている場合のみ追加
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      // プロキシサーバーが期待する形式に変換
      const proxyPayload = {
        userId: message.lineId,
        message: message.messageContent,
        type: message.type,
        customerName: message.customerName,
        reservationId: message.reservationId,
        timestamp: message.timestamp,
        ...message.bookingData,
        ...message.reminderData
      }

      console.log('📡 プロキシサーバーに送信するデータ:', JSON.stringify(proxyPayload, null, 2))

      const response = await axios.post(this.apiUrl, proxyPayload, {
        headers,
        timeout: 15000
      })

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data
      }
    } catch (error: any) {
      console.error('プロキシサーバー送信エラー:', error)
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'プロキシサーバー送信に失敗しました'
      }
    }
  }

  // 予約完了メッセージの送信
  async sendBookingCompletion(data: {
    lineId: string
    customerName: string
    reservationId: number
    date: string
    time: string
    program: string
    instructor: string
    studio: string
    messageContent: string
  }): Promise<ProxyResponse> {
    const message: ProxyMessage = {
      type: 'booking_completion',
      lineId: data.lineId,
      customerName: data.customerName,
      reservationId: data.reservationId,
      messageContent: data.messageContent,
      bookingData: {
        date: data.date,
        time: data.time,
        program: data.program,
        instructor: data.instructor,
        studio: data.studio
      },
      timestamp: new Date().toISOString()
    }

    return this.sendMessage(message)
  }

  // リマインダーメッセージの送信
  async sendReminder(data: {
    lineId: string
    customerName: string
    reservationId: number
    messageContent: string
    hoursUntil: number
    reminderType: string
    date: string
    time: string
    program: string
    instructor: string
    studio: string
  }): Promise<ProxyResponse> {
    const message: ProxyMessage = {
      type: 'reminder',
      lineId: data.lineId,
      customerName: data.customerName,
      reservationId: data.reservationId,
      messageContent: data.messageContent,
      bookingData: {
        date: data.date,
        time: data.time,
        program: data.program,
        instructor: data.instructor,
        studio: data.studio
      },
      reminderData: {
        hoursUntil: data.hoursUntil,
        reminderType: data.reminderType
      },
      timestamp: new Date().toISOString()
    }

    return this.sendMessage(message)
  }

  // キャンセルメッセージの送信
  async sendCancellation(data: {
    lineId: string
    customerName: string
    reservationId: number
    messageContent: string
    date: string
    time: string
    program: string
  }): Promise<ProxyResponse> {
    const message: ProxyMessage = {
      type: 'cancellation',
      lineId: data.lineId,
      customerName: data.customerName,
      reservationId: data.reservationId,
      messageContent: data.messageContent,
      bookingData: {
        date: data.date,
        time: data.time,
        program: data.program,
        instructor: '',
        studio: ''
      },
      timestamp: new Date().toISOString()
    }

    return this.sendMessage(message)
  }

  // プロキシサーバーのヘルスチェック
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.enabled) {
        return true // 開発モードでは常にOK
      }

      const headers: any = {}
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const response = await axios.get(`${this.apiUrl}/health`, {
        headers,
        timeout: 5000
      })

      return response.status === 200
    } catch (error) {
      console.error('プロキシサーバーヘルスチェックエラー:', error)
      return false
    }
  }

  // 連携状況の確認
  async getStatus(): Promise<{
    healthy: boolean
    lastMessage?: string
    messageCount?: number
    error?: string
  }> {
    try {
      if (!this.enabled) {
        return { healthy: true, messageCount: 0 }
      }

      const headers: any = {}
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const response = await axios.get(`${this.apiUrl}/api/status`, {
        headers,
        timeout: 5000
      })

      return {
        healthy: true,
        lastMessage: response.data.lastMessage,
        messageCount: response.data.messageCount
      }
    } catch (error: any) {
      console.error('プロキシサーバー状況確認エラー:', error)
      return {
        healthy: false,
        error: error.message
      }
    }
  }
}

// シングルトンインスタンス
export const proxyServerClient = new ProxyServerClient()