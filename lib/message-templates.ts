import fs from 'fs'
import path from 'path'

export interface MessageVariables {
  date: boolean
  time: boolean
  program: boolean
  instructor: boolean
}

export interface ReminderSettings {
  templates: {
    booking: {
      textMessage: string
      variables: MessageVariables
    }
    reminder: {
      messageText: string
      variables: MessageVariables
    }
  }
}

export interface ReminderSchedule {
  id: string
  name: string
  timingHours: number
  messageTemplate: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

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
    schedules: ReminderSchedule[]
    customSchedules: ReminderSchedule[]
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
      textMessage: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n👨‍🏫 インストラクター: {instructor}\n\nお忘れなくお越しください！',
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
      schedules: [
        {
          id: "24h",
          name: "24時間前",
          timingHours: 24,
          messageTemplate: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊',
          isActive: true,
        }
      ],
      customSchedules: []
    },
    cancellation: {
      enabled: true,
      messageText: 'ご予約をキャンセルしました。\n\nまたのご利用をお待ちしております。'
    }
  }
}

export function saveMessageSettings(settings: MessageSettings): boolean {
  try {
    const settingsPath = path.join(process.cwd(), 'message-settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('メッセージ設定の保存に失敗:', error)
    return false
  }
}

export function getEnabledReminderSchedules(): ReminderSchedule[] {
  const settings = getMessageSettings()
  if (!settings.reminder.enabled) {
    return []
  }
  
  const allSchedules = [
    ...settings.reminder.schedules,
    ...settings.reminder.customSchedules
  ]
  
  return allSchedules.filter(schedule => schedule.isActive)
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

// デフォルト設定（スタジオ情報を削除）
export const defaultMessageSettings: ReminderSettings = {
  templates: {
    booking: {
      textMessage: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n👨‍🏫 インストラクター: {instructor}\n\nお忘れなくお越しください！',
      variables: {
        date: true,
        time: true,
        program: true,
        instructor: true,
      }
    },
    reminder: {
      messageText: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊',
      variables: {
        date: true,
        time: true,
        program: true,
        instructor: true,
      }
    }
  }
}

// デフォルトリマインドスケジュール
export const defaultReminderSchedules: ReminderSchedule[] = [
  {
    id: 'default-24h',
    name: '24時間前',
    timingHours: 24,
    messageTemplate: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊',
    isActive: true,
  },
  {
    id: 'default-3h',
    name: '3時間前',
    timingHours: 3,
    messageTemplate: '【まもなくレッスン開始】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\n準備はOKですか？✨',
    isActive: true,
  },
  {
    id: 'default-1h',
    name: '1時間前',
    timingHours: 1,
    messageTemplate: '【レッスン開始まで1時間】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\nお待ちしています！',
    isActive: true,
  },
  {
    id: 'default-30m',
    name: '30分前',
    timingHours: 0.5,
    messageTemplate: '【レッスン開始まで30分】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\nお時間に遅れないよう、お気をつけください！',
    isActive: false, // デフォルトは無効
  },
]

// メッセージの変数置換
export function replaceMessageVariables(
  message: string, 
  data: { 
    date?: string
    time?: string
    program?: string
    instructor?: string
  }
): string {
  let result = message
  
  if (data.date) result = result.replace(/{date}/g, data.date)
  if (data.time) result = result.replace(/{time}/g, data.time)
  if (data.program) result = result.replace(/{program}/g, data.program)
  if (data.instructor) result = result.replace(/{instructor}/g, data.instructor)
  
  return result
}