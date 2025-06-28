import fs from 'fs'
import path from 'path'

export interface MessageSettings {
  bookingConfirmation: {
    enabled: boolean
    messageType: 'text' | 'flex'
    textMessage: string
    includeDetails: {
      date: boolean
      time: boolean
      program: boolean
      instructor: boolean
      studio: boolean
      capacity: boolean
    }
    customFields: string
  }
  reminder: {
    enabled: boolean
    hoursBefore: number
    messageText: string
  }
  cancellation: {
    enabled: boolean
    messageText: string
  }
}

export function getMessageSettings(): MessageSettings {
  try {
    const settingsPath = path.join(process.cwd(), 'message-settings.json')
    
    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.warn('メッセージ設定の読み込みに失敗:', error)
  }

  // デフォルト設定
  return {
    bookingConfirmation: {
      enabled: true,
      messageType: 'flex',
      textMessage: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n👨‍🏫 インストラクター: {instructor}\n🏢 スタジオ: {studio}\n\nお忘れなくお越しください！',
      includeDetails: {
        date: true,
        time: true,
        program: true,
        instructor: true,
        studio: true,
        capacity: false
      },
      customFields: ''
    },
    reminder: {
      enabled: true,
      hoursBefore: 24,
      messageText: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n🏢 {studio}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊'
    },
    cancellation: {
      enabled: true,
      messageText: 'ご予約をキャンセルしました。\n\nまたのご利用をお待ちしております。'
    }
  }
}

export function processMessageTemplate(template: string, data: any): string {
  let message = template

  // 利用可能な変数を置換
  if (data.date) message = message.replace(/{date}/g, data.date)
  if (data.time) message = message.replace(/{time}/g, data.time)
  if (data.program) message = message.replace(/{program}/g, data.program)
  if (data.instructor) message = message.replace(/{instructor}/g, data.instructor)
  if (data.studio) message = message.replace(/{studio}/g, data.studio)
  if (data.capacity) message = message.replace(/{capacity}/g, data.capacity)

  return message
}