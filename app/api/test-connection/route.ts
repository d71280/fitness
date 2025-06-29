import { NextRequest, NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const body = await request.json()

    if (type === 'sheets') {
      // Google Sheets接続テスト
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

    if (type === 'line-group') {
      // グループLINE通知テスト
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

    return NextResponse.json({
      success: false,
      error: '不明なテストタイプです'
    })

  } catch (error) {
    console.error('テスト接続エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'テスト接続に失敗しました'
    }, { status: 500 })
  }
}