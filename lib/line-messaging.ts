import axios from 'axios'

export interface LineMessage {
  type: 'text' | 'flex' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker'
  text?: string
  altText?: string
  contents?: any
  [key: string]: any
}

export class LineMessagingClient {
  private channelAccessToken: string
  private baseUrl: string

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!
    this.baseUrl = 'https://api.line.me/v2/bot'
    
    // 環境変数チェック
    if (!this.channelAccessToken && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  LINE_CHANNEL_ACCESS_TOKEN environment variable is not set')
    }
  }

  // 返信メッセージ送信
  async replyMessage(replyToken: string, message: LineMessage) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 LINE Reply Message (Development Mode):')
        console.log(`Reply Token: ${replyToken}`)
        console.log('Message:', JSON.stringify(message, null, 2))
        
        return { 
          success: true, 
          data: { messageId: `mock_reply_${Date.now()}` },
          mode: 'development'
        }
      }

      const response = await axios.post(`${this.baseUrl}/message/reply`, {
        replyToken: replyToken,
        messages: [message]
      }, {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return { success: true, data: response.data }
    } catch (error) {
      console.error('LINE返信メッセージ送信エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // プッシュメッセージ送信
  async pushMessage(userId: string, message: LineMessage) {
    try {
      // 詳細ログ出力
      console.log('📱 LINE Push Message 送信開始:', {
        userId: userId,
        hasAccessToken: !!this.channelAccessToken,
        environment: process.env.NODE_ENV,
        tokenPrefix: this.channelAccessToken ? this.channelAccessToken.substring(0, 8) + '...' : 'not_set'
      })

      // 環境変数チェック
      if (!this.channelAccessToken) {
        console.error('❌ LINE_CHANNEL_ACCESS_TOKEN is not set')
        return { 
          success: false, 
          error: 'LINE_CHANNEL_ACCESS_TOKEN environment variable is not set' 
        }
      }

      // 開発環境またはデバッグモード
      if (process.env.NODE_ENV === 'development' || process.env.LINE_DEBUG_MODE === 'true') {
        console.log('📱 LINE Push Message (Debug Mode):')
        console.log(`To User: ${userId}`)
        console.log('Message:', JSON.stringify(message, null, 2))
        
        return { 
          success: true, 
          data: { messageId: `mock_push_${Date.now()}` },
          mode: 'debug'
        }
      }

      const response = await axios.post(`${this.baseUrl}/message/push`, {
        to: userId,
        messages: [message]
      }, {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ LINE Push Message 送信成功')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ LINEプッシュメッセージ送信エラー:', error)
      
      // Axiosエラーの詳細ログ
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status)
        console.error('Data:', error.response?.data)
        console.error('Headers:', error.response?.headers)
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // マルチキャストメッセージ送信
  async multicastMessage(userIds: string[], message: LineMessage) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 LINE Multicast Message (Development Mode):')
        console.log(`To Users: ${userIds.join(', ')}`)
        console.log('Message:', JSON.stringify(message, null, 2))
        
        return { 
          success: true, 
          data: { messageId: `mock_multicast_${Date.now()}` },
          mode: 'development'
        }
      }

      const response = await axios.post(`${this.baseUrl}/message/multicast`, {
        to: userIds,
        messages: [message]
      }, {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return { success: true, data: response.data }
    } catch (error) {
      console.error('LINEマルチキャストメッセージ送信エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ユーザープロフィール取得
  async getUserProfile(userId: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 LINE Get User Profile (Development Mode):')
        console.log(`User ID: ${userId}`)
        
        return { 
          success: true, 
          data: { 
            userId: userId,
            displayName: 'テストユーザー',
            pictureUrl: '',
            statusMessage: ''
          },
          mode: 'development'
        }
      }

      const response = await axios.get(`${this.baseUrl}/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`
        }
      })

      return { success: true, data: response.data }
    } catch (error) {
      console.error('LINEユーザープロフィール取得エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}