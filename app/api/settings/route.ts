import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// 設定取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // 環境変数から現在の設定を取得
    const connectionSettings = {
      lstepChannelId: process.env.LSTEP_CHANNEL_ID || '',
      lineChannelSecret: process.env.LINE_CHANNEL_SECRET || '',
      lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      lineUserId: process.env.LINE_USER_ID || '',
      appBaseUrl: process.env.APP_BASE_URL || ''
    }

    // メッセージ設定をファイルから読み込み（実装簡略化のため固定値）
    const messageSettings = {
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

    return NextResponse.json({
      connection: connectionSettings,
      messages: messageSettings
    })
  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 })
  }
}

// 設定保存
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { connection, messages } = await request.json()
    
    // .env.local ファイルを更新
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8')
    } catch (error) {
      // ファイルが存在しない場合は新規作成
      envContent = ''
    }

    // 環境変数を更新または追加
    const updateEnvVar = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      const newLine = `${key}="${value}"`
      
      if (regex.test(content)) {
        return content.replace(regex, newLine)
      } else {
        return content + (content.endsWith('\n') || content === '' ? '' : '\n') + newLine + '\n'
      }
    }

    // 接続設定の各設定値を更新
    if (connection) {
      envContent = updateEnvVar(envContent, 'LSTEP_CHANNEL_ID', connection.lstepChannelId || '')
      envContent = updateEnvVar(envContent, 'LINE_CHANNEL_SECRET', connection.lineChannelSecret || '')
      envContent = updateEnvVar(envContent, 'LINE_CHANNEL_ACCESS_TOKEN', connection.lineChannelAccessToken || '')
      envContent = updateEnvVar(envContent, 'LINE_USER_ID', connection.lineUserId || '')
      envContent = updateEnvVar(envContent, 'APP_BASE_URL', connection.appBaseUrl || '')

      // プロセス環境変数も更新（即座に反映）
      process.env.LSTEP_CHANNEL_ID = connection.lstepChannelId || ''
      process.env.LINE_CHANNEL_SECRET = connection.lineChannelSecret || ''
      process.env.LINE_CHANNEL_ACCESS_TOKEN = connection.lineChannelAccessToken || ''
      process.env.LINE_USER_ID = connection.lineUserId || ''
      process.env.APP_BASE_URL = connection.appBaseUrl || ''
    }

    // メッセージ設定をJSONファイルに保存
    if (messages) {
      const messageSettingsPath = path.join(process.cwd(), 'message-settings.json')
      fs.writeFileSync(messageSettingsPath, JSON.stringify(messages, null, 2))
    }

    // ファイルに書き込み
    fs.writeFileSync(envPath, envContent)

    return NextResponse.json({ 
      success: true, 
      message: '設定を保存しました。変更を完全に反映するには、アプリケーションを再起動してください。' 
    })
  } catch (error) {
    console.error('設定保存エラー:', error)
    return NextResponse.json({ error: '設定の保存に失敗しました' }, { status: 500 })
  }
}