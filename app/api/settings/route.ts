import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

interface ConnectionSettings {
  appBaseUrl?: string
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
    const settings = {
      connection: {
        appBaseUrl: process.env.APP_BASE_URL || ''
      },
      googleSheets: {
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
        lineGroupToken: process.env.LINE_GROUP_TOKEN || '',
        enabled: process.env.GOOGLE_SHEETS_ENABLED === 'true'
      }
    }

    return NextResponse.json({
      success: true,
      ...settings
    })
  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json(
      { success: false, error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connection, googleSheets } = body as {
      connection?: ConnectionSettings
      googleSheets?: GoogleSheetsSettings
    }

    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // Vercel環境では環境変数をランタイムで変更できない
      console.log('Vercel環境: 環境変数の一時更新（再起動が必要）')
      
      // プロセス環境変数のみ更新（一時的）
      if (connection) {
        process.env.APP_BASE_URL = connection.appBaseUrl || ''
      }
      
      if (googleSheets) {
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = googleSheets.serviceAccountEmail || ''
        process.env.GOOGLE_PRIVATE_KEY = googleSheets.privateKey || ''
        process.env.GOOGLE_SPREADSHEET_ID = googleSheets.spreadsheetId || ''
        process.env.LINE_GROUP_TOKEN = googleSheets.lineGroupToken || ''
        process.env.GOOGLE_SHEETS_ENABLED = googleSheets.enabled ? 'true' : 'false'
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Vercel環境: 環境変数を一時的に更新しました。完全に反映するには、Vercelの環境変数設定で値を更新してください。',
        isVercel: true,
        instructions: [
          '1. Vercelダッシュボードにアクセス',
          '2. プロジェクト設定 → Environment Variables',
          '3. 以下の環境変数を設定/更新:',
          `   - APP_BASE_URL: ${connection?.appBaseUrl || '(値を設定)'}`,
          `   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${googleSheets?.serviceAccountEmail || '(値を設定)'}`,
          `   - GOOGLE_PRIVATE_KEY: ${googleSheets?.privateKey ? '(設定済み)' : '(値を設定)'}`,
          `   - GOOGLE_SPREADSHEET_ID: ${googleSheets?.spreadsheetId || '(値を設定)'}`,
          `   - LINE_GROUP_TOKEN: ${googleSheets?.lineGroupToken ? '(設定済み)' : '(値を設定)'}`,
          `   - GOOGLE_SHEETS_ENABLED: ${googleSheets?.enabled ? 'true' : 'false'}`,
          '4. 再デプロイして変更を反映'
        ]
      })
    }
    
    // ローカル開発環境では.env.localファイルを更新
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
      envContent = updateEnvVar(envContent, 'APP_BASE_URL', connection.appBaseUrl || '')
      
      // プロセス環境変数も更新（即座に反映）
      process.env.APP_BASE_URL = connection.appBaseUrl || ''
    }

    // Google Sheets設定の各設定値を更新
    if (googleSheets) {
      envContent = updateEnvVar(envContent, 'GOOGLE_SERVICE_ACCOUNT_EMAIL', googleSheets.serviceAccountEmail || '')
      envContent = updateEnvVar(envContent, 'GOOGLE_PRIVATE_KEY', googleSheets.privateKey || '')
      envContent = updateEnvVar(envContent, 'GOOGLE_SPREADSHEET_ID', googleSheets.spreadsheetId || '')
      envContent = updateEnvVar(envContent, 'LINE_GROUP_TOKEN', googleSheets.lineGroupToken || '')
      envContent = updateEnvVar(envContent, 'GOOGLE_SHEETS_ENABLED', googleSheets.enabled ? 'true' : 'false')

      // プロセス環境変数も更新（即座に反映）
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = googleSheets.serviceAccountEmail || ''
      process.env.GOOGLE_PRIVATE_KEY = googleSheets.privateKey || ''
      process.env.GOOGLE_SPREADSHEET_ID = googleSheets.spreadsheetId || ''
      process.env.LINE_GROUP_TOKEN = googleSheets.lineGroupToken || ''
      process.env.GOOGLE_SHEETS_ENABLED = googleSheets.enabled ? 'true' : 'false'
    }

    // ファイルに書き込み
    fs.writeFileSync(envPath, envContent)

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