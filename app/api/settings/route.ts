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
  serviceAccountEmail?: string
  privateKey?: string
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

    const googleSheets: GoogleSheetsSettings = {
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
      lineGroupToken: process.env.LINE_GROUP_TOKEN || '',
      enabled: false
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
    const { action, schedule } = body
    
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