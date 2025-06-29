import { NextRequest, NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testType = searchParams.get('type')
  
  try {
    const body = await request.json()
    
    switch (testType) {
      case 'line-official':
        return await testLineOfficialConnection(body)
      case 'sheets':
        return await testSheetsConnection(body)
      case 'line-group':
        return await testLineGroupConnection(body)
      case 'reminder':
        return await testReminderFunction(body)
      default:
        return NextResponse.json(
          { success: false, error: '無効なテストタイプです' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('接続テストエラー:', error)
    return NextResponse.json(
      { success: false, error: '接続テストに失敗しました' },
      { status: 500 }
    )
  }
}

async function testLineOfficialConnection(settings: any) {
  try {
    const { lineChannelAccessToken } = settings
    
    if (!lineChannelAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'チャンネルアクセストークンが設定されていません'
      })
    }

    // LINE APIに簡単なテストリクエストを送信
    const response = await fetch('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${lineChannelAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: 'LINE公式アカウントへの接続に成功しました',
        data: {
          displayName: data.displayName,
          userId: data.userId
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'LINE APIへの接続に失敗しました'
      })
    }
  } catch (error) {
    console.error('LINE公式アカウント接続テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'LINE公式アカウント接続テストに失敗しました'
    })
  }
}

async function testSheetsConnection(body: any) {
  try {
    const { serviceAccountEmail, privateKey, spreadsheetId } = body
    
    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets設定が不完全です'
      })
    }

    // テスト用のGoogleSpreadsheetクライアントを作成
    const serviceAccountAuth = new JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    })

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)
    await doc.loadInfo()
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets接続テストが成功しました',
      details: {
        spreadsheetTitle: doc.title,
        sheetCount: doc.sheetCount,
        spreadsheetId: doc.spreadsheetId
      }
    })

  } catch (error) {
    console.error('Google Sheets接続テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Sheets接続に失敗しました'
    })
  }
}

async function testLineGroupConnection(body: any) {
  try {
    const { lineGroupToken } = body
    
    if (!lineGroupToken) {
      return NextResponse.json({
        success: false,
        error: 'グループLINE Botトークンが設定されていません'
      })
    }

    // テスト通知を送信（実際のグループではなく、アクセストークンの有効性確認）
    const testMessage = {
      type: 'text',
      text: '🧪 グループLINE通知テストメッセージです\n設定が正常に動作しています！'
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineGroupToken}`
      },
      body: JSON.stringify({
        to: 'TEST_GROUP_ID', // 実際のテストではダミーIDを使用
        messages: [testMessage]
      })
    })

    // アクセストークンが有効かどうかの確認
    if (response.status === 200 || response.status === 400) {
      // 400エラーでも、トークンが有効で送信先IDが無効な場合は接続自体は成功
      return NextResponse.json({
        success: true,
        message: 'グループLINE Bot設定は有効です（テストメッセージは送信されませんでした）',
        note: '実際の通知はGoogle Apps Scriptから送信されます'
      })
    } else {
      throw new Error(`LINE API エラー: ${response.status}`)
    }

  } catch (error) {
    console.error('グループLINE通知テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'グループLINE通知設定に問題があります'
    })
  }
}

async function testReminderFunction(body: any) {
  try {
    // リマインド機能のテスト実行
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/daily-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: 'リマインド機能テストが完了しました',
        details: data
      })
    } else {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: 'リマインド機能テストに失敗しました',
        details: errorData
      })
    }

  } catch (error) {
    console.error('リマインド機能テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'リマインド機能テストに失敗しました'
    })
  }
}