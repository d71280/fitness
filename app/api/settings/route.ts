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

    return NextResponse.json({
      success: true,
      connection,
      googleSheets
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
    const { connection, googleSheets } = body

    // 基本的な検証
    if (!connection || !googleSheets) {
      return NextResponse.json(
        { success: false, error: '設定データが不正です' },
        { status: 400 }
      )
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