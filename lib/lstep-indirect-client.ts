// Lステップ間接連携クライアント
// APIキーを使わず、公式LINE経由でLステップと連携

import { LineMessagingClient } from './line-messaging'

export interface LstepTriggerData {
  action: string
  data: Record<string, any>
}

export class LstepIndirectClient {
  private lineClient: LineMessagingClient

  constructor() {
    this.lineClient = new LineMessagingClient()
  }

  // 予約完了情報をLステップに送信（特殊フォーマット）
  async sendBookingComplete(lineId: string, booking: {
    id: number
    customerName: string
    date: string
    time: string
    program: string
    instructor: string
    studio: string
  }) {
    // Lステップが検出できる特殊フォーマット
    const hiddenData = `#BOOKING_${booking.id}_${booking.program.replace(/\s/g, '_')}`
    
    // Flexメッセージで見た目は通常の予約確認、裏でデータ送信
    const message = {
      type: 'flex',
      altText: '予約完了のお知らせ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#4CAF50',
          paddingAll: '20px',
          contents: [
            {
              type: 'text',
              text: '予約が完了しました',
              color: '#ffffff',
              size: 'xl',
              weight: 'bold'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'text',
              text: `${booking.customerName}様`,
              size: 'lg',
              weight: 'bold'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '日時',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: `${booking.date} ${booking.time}`,
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'プログラム',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: booking.program,
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'インストラクター',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: booking.instructor,
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'スタジオ',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: booking.studio,
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            // 見えないデータ埋め込み（白文字で非表示）
            {
              type: 'text',
              text: hiddenData,
              size: 'xxs',
              color: '#ffffff',
              margin: 'none'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#4CAF50',
              action: {
                type: 'postback',
                label: '予約内容を確認',
                data: `lstep_action=confirm_booking&booking_id=${booking.id}`,
                displayText: '予約内容を確認'
              }
            },
            {
              type: 'button',
              style: 'link',
              action: {
                type: 'postback',
                label: 'キャンセルポリシーを見る',
                data: 'lstep_action=show_cancel_policy',
                displayText: 'キャンセルポリシー'
              }
            }
          ]
        }
      }
    }

    return await this.lineClient.pushMessage(lineId, message)
  }

  // キャンセル可能な予約一覧を送信
  async sendCancellableBookings(lineId: string, bookings: Array<{
    id: number
    date: string
    time: string
    program: string
  }>) {
    if (bookings.length === 0) {
      return await this.lineClient.pushMessage(lineId, {
        type: 'text',
        text: 'キャンセル可能な予約はありません。'
      })
    }

    const bubbles = bookings.map(booking => ({
      type: 'bubble',
      size: 'micro',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '13px',
        contents: [
          {
            type: 'text',
            text: booking.program,
            weight: 'bold',
            size: 'sm'
          },
          {
            type: 'text',
            text: `${booking.date} ${booking.time}`,
            size: 'xs',
            color: '#8c8c8c',
            margin: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'キャンセル',
            data: `lstep_action=cancel_request&booking_id=${booking.id}`,
            displayText: `${booking.program}をキャンセル`
          }
        }]
      }
    }))

    const message = {
      type: 'flex',
      altText: 'キャンセル可能な予約一覧',
      contents: {
        type: 'carousel',
        contents: bubbles
      }
    }

    return await this.lineClient.pushMessage(lineId, message)
  }

  // Lステップトリガー用のキーワードメッセージ送信
  async sendTriggerKeyword(lineId: string, keyword: string, data?: Record<string, any>) {
    // Lステップで設定したキーワードに反応させる
    let message = keyword
    
    if (data) {
      // データをJSON形式で追加（Lステップで解析）
      message += `\n${JSON.stringify(data)}`
    }

    return await this.lineClient.pushMessage(lineId, {
      type: 'text',
      text: message
    })
  }

  // Google Sheets連携用のデータ送信
  async sendViaGoogleSheets(lineId: string, action: string, data: Record<string, any>) {
    // Google Sheetsに記録 → Lステップが定期的に参照
    const sheetsData = {
      timestamp: new Date().toISOString(),
      line_id: lineId,
      action: action,
      ...data
    }

    // この実装は別途Google Sheets APIを使用
    console.log('Google Sheets連携データ:', sheetsData)
    
    // ユーザーには通常のメッセージを送信
    return await this.lineClient.pushMessage(lineId, {
      type: 'text',
      text: '処理を受け付けました。しばらくお待ちください。'
    })
  }

  // リッチメニュー切り替え指示
  async switchRichMenu(lineId: string, menuType: 'default' | 'member' | 'premium') {
    // Lステップのリッチメニュー切り替えトリガー
    const triggers = {
      default: '#MENU_DEFAULT',
      member: '#MENU_MEMBER',
      premium: '#MENU_PREMIUM'
    }

    return await this.lineClient.pushMessage(lineId, {
      type: 'text',
      text: triggers[menuType]
    })
  }
}

// シングルトンインスタンス
export const lstepIndirectClient = new LstepIndirectClient()