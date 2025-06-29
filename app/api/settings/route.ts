import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

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

interface MessageSettings {
  bookingConfirmation: {
    enabled: boolean
    messageText: string
  }
  reminder: {
    enabled: boolean
    hoursBefore: number
    messageText: string
  }
}

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

    // メッセージ設定をファイルまたは環境変数から読み取り
    let messages: MessageSettings = {
      bookingConfirmation: {
        enabled: true,
        messageText: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n👨‍🏫 インストラクター: {instructor}\n🏢 スタジオ: {studio}\n\nお忘れなくお越しください！'
      },
      reminder: {
        enabled: true,
        hoursBefore: 24,
        messageText: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n🏢 {studio}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊'
      }
    }

    // message-settings.jsonから設定を読み取り
    try {
      const messagesFilePath = path.join(process.cwd(), 'message-settings.json')
      if (fs.existsSync(messagesFilePath)) {
        const fileContent = fs.readFileSync(messagesFilePath, 'utf8')
        const savedMessages = JSON.parse(fileContent)
        messages = { ...messages, ...savedMessages }
      }
    } catch (error) {
      console.warn('メッセージ設定ファイルの読み取りに失敗:', error)
    }

    return NextResponse.json({
      success: true,
      connection,
      googleSheets,
      messages
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
    const { connection, googleSheets, messages } = body

    // 基本的な検証
    if (!connection || !googleSheets) {
      return NextResponse.json(
        { success: false, error: '設定データが不正です' },
        { status: 400 }
      )
    }

    // メッセージ設定をファイルに保存
    if (messages) {
      try {
        const messagesFilePath = path.join(process.cwd(), 'message-settings.json')
        fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2))
        console.log('メッセージ設定が保存されました:', messages)
      } catch (error) {
        console.error('メッセージ設定の保存に失敗:', error)
      }
    }

    // ここで実際には環境変数の設定やファイルへの書き込みを行う
    // 現在はモック実装
    console.log('Connection設定:', connection)
    console.log('Google Sheets設定:', googleSheets)

    return NextResponse.json({
      success: true,
      message: '設定が保存されました'
    })
  } catch (error) {
    console.error('設定保存エラー:', error)
    return NextResponse.json(
      { success: false, error: '設定の保存に失敗しました' },
      { status: 500 }
    )
  }
}