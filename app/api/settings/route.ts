// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { getMessageSettings, saveMessageSettings, type MessageSettings, type ReminderSchedule } from '@/lib/message-templates'
import { z } from 'zod'

interface ConnectionSettings {
  appBaseUrl: string
  lineChannelAccessToken: string
  lineChannelSecret: string
  liffId: string
  richMenuId: string
}

interface GoogleSheetsSettings {
  spreadsheetId?: string
  lineGroupToken?: string
  enabled?: boolean
}

const reminderScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
      timingHours: z.number().min(0).max(168), // 最大1週間前
  messageText: z.string().min(1).max(1000)
})

const messageSettingsSchema = z.object({
  bookingConfirmation: z.object({
    enabled: z.boolean(),
    messageType: z.enum(['text', 'flex']),
    textMessage: z.string(),
    includeDetails: z.object({
      date: z.boolean(),
      time: z.boolean(),
      program: z.boolean(),
      instructor: z.boolean(),
      studio: z.boolean(),
      capacity: z.boolean()
    }),
    customFields: z.string()
  }),
  reminder: z.object({
    enabled: z.boolean(),
    schedules: z.array(reminderScheduleSchema),
    customSchedules: z.array(reminderScheduleSchema)
  }),
  cancellation: z.object({
    enabled: z.boolean(),
    messageText: z.string()
  })
})

export async function GET() {
  try {
    const connection: ConnectionSettings = {
      appBaseUrl: process.env.APP_BASE_URL || '',
      lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      lineChannelSecret: process.env.LINE_CHANNEL_SECRET || '',
      liffId: process.env.LIFF_ID || '',
      richMenuId: process.env.RICH_MENU_ID || ''
    }

    // 保存された設定を読み込み
    let savedSettings = {}
    try {
      const settingsPath = path.join(process.cwd(), 'app-settings.json')
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf8')
        savedSettings = JSON.parse(content)
      }
    } catch (error) {
      console.warn('保存された設定の読み込みに失敗:', error)
    }

    const googleSheets: GoogleSheetsSettings = {
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '',
      lineGroupToken: process.env.LINE_GROUP_TOKEN || '',
      enabled: savedSettings.spreadsheetEnabled || false
    }

    const settings = getMessageSettings()

    return NextResponse.json({
      success: true,
      connection,
      googleSheets,
      settings
    })
  } catch (error) {
    console.error('設定読み込みエラー:', error)
    return NextResponse.json(
      { success: false, error: '設定の読み込みに失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 POST /api/settings 受信データ:', JSON.stringify(body, null, 2))
    const { action, schedule, settings: userSettings, messages } = body
    
    // メッセージ設定の保存
    if (messages) {
      console.log('💾 メッセージ設定保存開始:', JSON.stringify(messages, null, 2))
      try {
        const saved = saveMessageSettings(messages)
        if (!saved) {
          console.error('❌ メッセージ設定の保存に失敗しました')
        } else {
          console.log('✅ メッセージ設定が保存されました')
        }
      } catch (messageError) {
        console.error('❌ メッセージ設定保存エラー:', messageError)
      }
    } else {
      console.log('⚠️ メッセージ設定が送信されていません')
    }
    
    // メッセージ設定のみが送信された場合
    if (!action && !userSettings && messages) {
      return NextResponse.json({
        success: true,
        message: 'メッセージ設定が保存されました',
        messagesUpdated: true
      })
    }
    
    // 基本設定の保存（環境変数以外の設定）
    if (!action && userSettings) {
      try {
        // 設定ファイルのパス
        const settingsPath = path.join(process.cwd(), 'app-settings.json')
        
        // 既存の設定を読み込み
        let existingSettings = {}
        if (fs.existsSync(settingsPath)) {
          try {
            const content = fs.readFileSync(settingsPath, 'utf8')
            existingSettings = JSON.parse(content)
          } catch (parseError) {
            console.warn('既存設定ファイルの読み込みに失敗:', parseError)
          }
        }
        
        // 新しい設定をマージ
        const updatedSettings = {
          ...existingSettings,
          ...userSettings,
          updatedAt: new Date().toISOString()
        }
        
        // 設定ファイルに保存（Vercel環境では書き込み権限がない場合があるため、try-catch）
        try {
          fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), 'utf8')
          console.log('設定がファイルに保存されました:', updatedSettings)
        } catch (writeError) {
          // Vercel環境などでファイル書き込みができない場合
          console.warn('ファイル書き込みに失敗（読み取り専用環境）:', writeError.message)
          
          // この場合、クライアントサイドのローカルストレージを使用するよう指示
          return NextResponse.json({
            success: true,
            message: messages ? 'メッセージ設定と基本設定が保存されました（クライアントサイドストレージ使用）' : '設定が保存されました（クライアントサイドストレージ使用）',
            settings: updatedSettings,
            useClientStorage: true,
            messagesUpdated: !!messages
          })
        }
        
        return NextResponse.json({
          success: true,
          message: messages ? 'メッセージ設定と基本設定が保存されました' : '設定が保存されました',
          settings: updatedSettings,
          messagesUpdated: !!messages
        })
      } catch (saveError) {
        console.error('設定保存エラー:', saveError)
        return NextResponse.json({
          success: false,
          error: '設定の保存に失敗しました'
        }, { status: 500 })
      }
    }
    
    if (action === 'addReminderSchedule') {
      const validatedSchedule = reminderScheduleSchema.parse(schedule)
      
      const settings = getMessageSettings()
      
      // IDの重複チェック
      const allSchedules = [...settings.reminder.schedules, ...settings.reminder.customSchedules]
      if (allSchedules.some(s => s.id === validatedSchedule.id)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'このIDは既に使用されています' 
          },
          { status: 400 }
        )
      }
      
      // カスタムスケジュールに追加
      settings.reminder.customSchedules.push(validatedSchedule)
      
      const success = saveMessageSettings(settings)
      
      if (!success) {
        return NextResponse.json(
          { 
            success: false,
            error: 'スケジュールの追加に失敗しました' 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'リマインドスケジュールが追加されました',
        schedule: validatedSchedule
      })
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: '無効なアクションです' 
      },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('スケジュール追加エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: '入力データが無効です',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'スケジュールの追加に失敗しました' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const scheduleId = url.searchParams.get('scheduleId')
    
    if (!scheduleId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'スケジュールIDが必要です' 
        },
        { status: 400 }
      )
    }
    
    const settings = getMessageSettings()
    
    // カスタムスケジュールから削除（デフォルトスケジュールは削除不可）
    const initialLength = settings.reminder.customSchedules.length
    settings.reminder.customSchedules = settings.reminder.customSchedules.filter(
      s => s.id !== scheduleId
    )
    
    if (settings.reminder.customSchedules.length === initialLength) {
      return NextResponse.json(
        { 
          success: false,
          error: 'デフォルトスケジュールは削除できません' 
        },
        { status: 400 }
      )
    }
    
    const success = saveMessageSettings(settings)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'スケジュールの削除に失敗しました' 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'リマインドスケジュールが削除されました'
    })
    
  } catch (error) {
    console.error('スケジュール削除エラー:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'スケジュールの削除に失敗しました' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedSettings = messageSettingsSchema.parse(body)
    
    // 設定保存
    const success = saveMessageSettings(validatedSettings)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: '設定の保存に失敗しました' 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '設定が保存されました',
      settings: validatedSettings
    })
    
  } catch (error) {
    console.error('設定更新エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: '入力データが無効です',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: '設定の更新に失敗しました' 
      },
      { status: 500 }
    )
  }
}