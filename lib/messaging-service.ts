// 統合メッセージング サービス
// 公式LINE直送信とLステップ経由の切り替えが可能

import { LineMessagingClient, LineMessage } from './line-messaging'
import { LstepClient, LstepMessage, LstepResponse } from './lstep-client'

export type MessagingProvider = 'line' | 'lstep'

export interface BookingNotificationData {
  customerName: string
  lineId: string
  date: string
  time: string
  program: string
  instructor: string
  studio: string
  reservationId: number
  programColor?: string
}

export interface ReminderNotificationData {
  customerName: string
  lineId: string
  date: string
  time: string
  program: string
  studio: string
  hoursUntil: number
}

export interface CancellationNotificationData {
  customerName: string
  lineId: string
  date: string
  time: string
  program: string
  reason?: string
}

export class MessagingService {
  private lineClient: LineMessagingClient
  private lstepClient: LstepClient
  private defaultProvider: MessagingProvider

  constructor() {
    this.lineClient = new LineMessagingClient()
    this.lstepClient = new LstepClient()
    
    // 環境変数で利用するプロバイダーを切り替え
    this.defaultProvider = (process.env.MESSAGING_PROVIDER as MessagingProvider) || 'lstep'
    
    console.log(`📱 メッセージングプロバイダー: ${this.defaultProvider}`)
  }

  // 予約確認通知の送信
  async sendBookingConfirmation(
    data: BookingNotificationData, 
    provider?: MessagingProvider
  ): Promise<{ success: boolean; messageId?: string; error?: string; provider: string }> {
    const selectedProvider = provider || this.defaultProvider

    try {
      if (selectedProvider === 'lstep') {
        // Lステップ経由でリッチメッセージを送信
        const result = await this.lstepClient.sendRichBookingConfirmation(data.lineId, {
          customerName: data.customerName,
          date: data.date,
          time: data.time,
          program: data.program,
          instructor: data.instructor,
          studio: data.studio,
          reservationId: data.reservationId,
          programColor: data.programColor || '#4CAF50'
        })

        // 通知ログをデータベースに保存
        await this.saveNotificationLog({
          customer_line_id: data.lineId,
          reservation_id: data.reservationId,
          notification_type: 'booking_confirmation',
          message_content: {
            provider: 'lstep',
            type: 'rich_booking_confirmation',
            data: data
          },
          lstep_response: result,
          success: result.success,
          error_message: result.error
        })

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          provider: 'lstep'
        }
      } else {
        // 公式LINE直送信
        const message: LineMessage = {
          type: 'text',
          text: `🎉 予約が完了しました！

📅 日時: ${data.date} ${data.time}
🏃‍♀️ プログラム: ${data.program}
👨‍🏫 インストラクター: ${data.instructor}
🏢 スタジオ: ${data.studio}
🆔 予約ID: ${data.reservationId}

${data.customerName}様、お疲れ様でした！
当日お待ちしております✨`
        }

        const result = await this.lineClient.pushMessage(data.lineId, message)

        // 通知ログをデータベースに保存
        await this.saveNotificationLog({
          customer_line_id: data.lineId,
          reservation_id: data.reservationId,
          notification_type: 'booking_confirmation',
          message_content: {
            provider: 'line',
            type: 'text',
            message: message
          },
          lstep_response: null,
          success: result.success,
          error_message: result.success ? null : 'LINE送信エラー'
        })

        return {
          success: result.success,
          messageId: result.data?.messageId,
          error: result.success ? undefined : 'LINE送信に失敗しました',
          provider: 'line'
        }
      }
    } catch (error: any) {
      console.error(`${selectedProvider}経由の予約確認送信エラー:`, error)
      
      return {
        success: false,
        error: error.message || `${selectedProvider}送信に失敗しました`,
        provider: selectedProvider
      }
    }
  }

  // リマインダー通知の送信
  async sendReminder(
    data: ReminderNotificationData, 
    provider?: MessagingProvider
  ): Promise<{ success: boolean; messageId?: string; error?: string; provider: string }> {
    const selectedProvider = provider || this.defaultProvider

    try {
      if (selectedProvider === 'lstep') {
        const result = await this.lstepClient.sendReminder(data.lineId, {
          customerName: data.customerName,
          date: data.date,
          time: data.time,
          program: data.program,
          studio: data.studio,
          hoursUntil: data.hoursUntil
        })

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          provider: 'lstep'
        }
      } else {
        const message: LineMessage = {
          type: 'text',
          text: `⏰ レッスンのリマインダー

${data.customerName}様
${data.hoursUntil}時間後にレッスンがあります！

📅 日時: ${data.date} ${data.time}
🏃‍♀️ プログラム: ${data.program}
🏢 スタジオ: ${data.studio}

準備はお済みですか？
お待ちしております😊`
        }

        const result = await this.lineClient.pushMessage(data.lineId, message)

        return {
          success: result.success,
          messageId: result.data?.messageId,
          error: result.success ? undefined : 'LINE送信に失敗しました',
          provider: 'line'
        }
      }
    } catch (error: any) {
      console.error(`${selectedProvider}経由のリマインダー送信エラー:`, error)
      
      return {
        success: false,
        error: error.message || `${selectedProvider}送信に失敗しました`,
        provider: selectedProvider
      }
    }
  }

  // キャンセル確認通知の送信
  async sendCancellationConfirmation(
    data: CancellationNotificationData, 
    provider?: MessagingProvider
  ): Promise<{ success: boolean; messageId?: string; error?: string; provider: string }> {
    const selectedProvider = provider || this.defaultProvider

    try {
      if (selectedProvider === 'lstep') {
        const result = await this.lstepClient.sendCancellationConfirmation(data.lineId, {
          customerName: data.customerName,
          date: data.date,
          time: data.time,
          program: data.program,
          reason: data.reason
        })

        return {
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          provider: 'lstep'
        }
      } else {
        const message: LineMessage = {
          type: 'text',
          text: `❌ キャンセルが完了しました

${data.customerName}様

以下の予約をキャンセルいたしました：
📅 日時: ${data.date} ${data.time}
🏃‍♀️ プログラム: ${data.program}

またのご利用をお待ちしております🙏`
        }

        const result = await this.lineClient.pushMessage(data.lineId, message)

        return {
          success: result.success,
          messageId: result.data?.messageId,
          error: result.success ? undefined : 'LINE送信に失敗しました',
          provider: 'line'
        }
      }
    } catch (error: any) {
      console.error(`${selectedProvider}経由のキャンセル確認送信エラー:`, error)
      
      return {
        success: false,
        error: error.message || `${selectedProvider}送信に失敗しました`,
        provider: selectedProvider
      }
    }
  }

  // 通知ログをデータベースに保存
  private async saveNotificationLog(logData: {
    customer_line_id: string
    reservation_id: number
    notification_type: string
    message_content: any
    lstep_response: any
    success: boolean
    error_message: string | null
  }) {
    try {
      // Supabaseクライアントを使用してログ保存
      // 実装は後で追加（エラーでも処理は継続）
      console.log('通知ログ保存:', logData)
    } catch (error) {
      console.warn('通知ログ保存エラー:', error)
    }
  }

  // プロバイダーの切り替え
  setDefaultProvider(provider: MessagingProvider) {
    this.defaultProvider = provider
    console.log(`📱 メッセージングプロバイダーを変更: ${provider}`)
  }

  // 両方のプロバイダーのヘルスチェック
  async healthCheck(): Promise<{
    line: boolean
    lstep: boolean
    currentProvider: MessagingProvider
  }> {
    const [lineHealthy, lstepHealthy] = await Promise.all([
      this.lineClient.healthCheck?.() || true,
      this.lstepClient.healthCheck()
    ])

    return {
      line: lineHealthy,
      lstep: lstepHealthy,
      currentProvider: this.defaultProvider
    }
  }
}

// シングルトンインスタンス
export const messagingService = new MessagingService()