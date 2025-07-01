// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface BookingData {
  日付: string
  名前: string
  体験日: string
  プログラム: string
}

interface RequestBody {
  spreadsheetId: string
  bookingData: BookingData
}

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, bookingData }: RequestBody = await request.json()

    // 必須フィールドのバリデーション
    if (!bookingData.名前 || !bookingData.体験日 || !bookingData.プログラム) {
      return NextResponse.json(
        { error: '必須フィールド（名前、体験日、プログラム）が不足しています' },
        { status: 400 }
      )
    }

    // Supabaseからユーザーの認証情報を取得
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // Googleアクセストークンを取得
    const accessToken = session.provider_token
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Googleアクセストークンが見つかりません' },
        { status: 401 }
      )
    }

    // ヘッダー行が存在するかチェック
    const rangeResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:D1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!rangeResponse.ok) {
      throw new Error(`スプレッドシート読み取りエラー: ${rangeResponse.status}`)
    }

    const rangeData = await rangeResponse.json()
    
    // ヘッダーが存在しない場合は設定
    if (!rangeData.values || rangeData.values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:D1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [['日付', '名前', '体験日', 'プログラム']]
          })
        }
      )
    }

    // 新しいデータを追加
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:D:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[
            bookingData.日付,
            bookingData.名前,
            bookingData.体験日,
            bookingData.プログラム
          ]]
        })
      }
    )

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text()
      throw new Error(`データ追加エラー: ${appendResponse.status} ${errorText}`)
    }

    const result = await appendResponse.json()

    console.log('✅ スプレッドシートに予約を記録しました:', {
      customerName: bookingData.名前,
      program: bookingData.プログラム,
      experienceDate: bookingData.体験日,
      range: result.updates?.updatedRange
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Google Sheetsに正常に同期されました',
      updatedRange: result.updates?.updatedRange
    })

  } catch (error) {
    console.error('Google Sheets API エラー:', error)
    return NextResponse.json(
      { 
        error: 'Google Sheetsとの同期に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}