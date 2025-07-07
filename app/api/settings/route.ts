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
  isActive: z.boolean().optional().default(true), // フロントエンドは isActive を使用
  timingHours: z.number().min(0).max(168), // 最大1週間前
  messageTemplate: z.string().min(1).max(1000) // フロントエンドは messageTemplate を使用
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
    console.log('📖 GET /api/settings 呼び出し')
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

    // Vercel環境ではキャッシュされた設定を優先的に使用
    const rawMessageSettings = global.cachedMessageSettings || getMessageSettings()
    console.log('📖 生のメッセージ設定:', JSON.stringify(rawMessageSettings, null, 2))
    if (global.cachedMessageSettings) {
      console.log('💾 キャッシュからメッセージ設定を読み込みました')
    }

    // フロントエンドが期待する形式に変換
    const convertedMessageSettings = {
      bookingConfirmation: {
        enabled: rawMessageSettings.bookingConfirmation.enabled,
        messageText: rawMessageSettings.bookingConfirmation.textMessage
      },
      reminder: {
        enabled: rawMessageSettings.reminder.enabled,
        hoursBefore: rawMessageSettings.reminder.schedules.find(s => s.id === '1d')?.hoursBefore || 24,
        messageText: rawMessageSettings.reminder.schedules.find(s => s.id === '1d')?.messageText || ''
      }
    }
    
    console.log('📖 変換後のメッセージ設定:', JSON.stringify(convertedMessageSettings, null, 2))

    const response = {
      success: true,
      connection,
      googleSheets,
      settings: savedSettings,
      messages: convertedMessageSettings
    }
    
    console.log('📖 GET /api/settings レスポンス:', JSON.stringify(response, null, 2))

    return NextResponse.json(response)
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
        // 現在の設定を読み込み
        const currentSettings = getMessageSettings()
        console.log('📖 現在の設定構造:', JSON.stringify(currentSettings, null, 2))
        
        // フロントエンドの簡略化されたデータを既存の構造に変換
        const convertedSettings = {
          ...currentSettings,
          bookingConfirmation: {
            ...currentSettings.bookingConfirmation,
            enabled: messages.bookingConfirmation?.enabled ?? currentSettings.bookingConfirmation.enabled,
            textMessage: messages.bookingConfirmation?.messageText ?? currentSettings.bookingConfirmation.textMessage
          },
          reminder: {
            ...currentSettings.reminder,
            enabled: messages.reminder?.enabled ?? currentSettings.reminder.enabled,
            schedules: currentSettings.reminder.schedules.map(schedule => {
              // 24時間前（1日前）のスケジュールを更新
              if (schedule.id === '1d' && messages.reminder?.messageText) {
                return {
                  ...schedule,
                  messageText: messages.reminder.messageText
                }
              }
              return schedule
            })
          }
        }
        
        console.log('🔄 変換後の設定:', JSON.stringify(convertedSettings, null, 2))
        
        const saved = saveMessageSettings(convertedSettings)
        if (!saved) {
          console.warn('⚠️ ファイル保存に失敗（Vercel制限）、データベースとメモリに保存')
          // Vercel環境では書き込み制限があるため、データベースとグローバル変数にキャッシュ
          global.cachedMessageSettings = convertedSettings
          
          // データベースにも保存
          try {
            console.log('📊 データベース保存開始:', JSON.stringify(convertedSettings, null, 2))
            const { createClient } = await import('@/utils/supabase/server')
            const supabase = createClient()
            
            const saveData = {
              id: 'default',
              message_settings: convertedSettings,
              updated_at: new Date().toISOString()
            }
            console.log('📊 保存データ:', JSON.stringify(saveData, null, 2))
            
            const { data, error: dbError } = await supabase
              .from('app_settings')
              .upsert(saveData)
              .select()
            
            if (dbError) {
              console.error('❌ データベース保存エラー:', dbError)
            } else {
              console.log('✅ データベースに保存されました:', data)
            }
          } catch (dbSaveError) {
            console.error('❌ データベース保存処理エラー:', dbSaveError)
          }
        } else {
          console.log('✅ ファイルに保存されました')
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
      console.log('📝 カスタムリマインドスケジュール追加開始:', schedule)
      
      try {
        const validatedSchedule = reminderScheduleSchema.parse(schedule)
        console.log('✅ スケジュールバリデーション成功:', validatedSchedule)
      
        const settings = getMessageSettings()
        console.log('📖 現在の設定:', settings)
        
        // IDの重複チェック
        const allSchedules = [...settings.reminder.schedules, ...settings.reminder.customSchedules]
        if (allSchedules.some(s => s.id === validatedSchedule.id)) {
          console.log('❌ ID重複エラー:', validatedSchedule.id)
          return NextResponse.json(
            { 
              success: false,
              error: 'このIDは既に使用されています' 
            },
            { status: 400 }
          )
        }
        
        // フロントエンド形式をJSONファイル形式に変換
        const convertedSchedule = {
          id: validatedSchedule.id,
          name: validatedSchedule.name,
          enabled: validatedSchedule.isActive ?? true,
          hoursBefore: validatedSchedule.timingHours,
          messageText: validatedSchedule.messageTemplate
        }
        
        // カスタムスケジュールに追加
        settings.reminder.customSchedules.push(convertedSchedule)
        console.log('📝 スケジュール追加後:', settings.reminder.customSchedules)
        
        const success = saveMessageSettings(settings)
        console.log('💾 保存結果:', success)
        
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
        
      } catch (scheduleError) {
        console.error('❌ カスタムスケジュール追加エラー:', scheduleError)
        
        if (scheduleError instanceof z.ZodError) {
          return NextResponse.json(
            { 
              success: false,
              error: '入力データが無効です',
              details: scheduleError.errors
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: 'スケジュールの追加に失敗しました',
            details: scheduleError instanceof Error ? scheduleError.message : String(scheduleError)
          },
          { status: 500 }
        )
      }
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