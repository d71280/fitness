// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'

interface ReservationData {
  id: number
  customerName: string
  customerPhone?: string
  scheduleDatetime: string
  programName: string
  instructorName: string
  reservedAt: string
}

// Google Sheets クライアントの初期化
async function initGoogleSheets() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets の環境変数が設定されていません')
  }

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID)
  
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })

  await doc.loadInfo()
  return doc
}

// スプレッドシートに予約データを追加
async function addReservationToSheet(reservationData: ReservationData) {
  try {
    const doc = await initGoogleSheets()
    
    // 最初のシートを取得、なければ作成
    let sheet = doc.sheetsByIndex[0]
    if (!sheet) {
      sheet = await doc.addSheet({ title: '予約データ' })
    }

    // ヘッダーが存在しない場合は設定
    const rows = await sheet.getRows()
    if (rows.length === 0) {
      await sheet.setHeaderRow([
        '予約ID',
        '顧客名', 
        '電話番号',
        '予約日時',
        'プログラム名',
        'インストラクター名',
        '予約完了日時'
      ])
    }

    // 新しい予約データを追加
    await sheet.addRow({
      '予約ID': reservationData.id,
      '顧客名': reservationData.customerName,
      '電話番号': reservationData.customerPhone || '',
      '予約日時': reservationData.scheduleDatetime,
      'プログラム名': reservationData.programName,
      'インストラクター名': reservationData.instructorName,
      '予約完了日時': reservationData.reservedAt
    })

    return { success: true }
  } catch (error) {
    console.error('Google Sheets同期エラー:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const reservationData: ReservationData = await request.json()

    // 必須フィールドのバリデーション
    if (!reservationData.id || !reservationData.customerName || !reservationData.scheduleDatetime) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    await addReservationToSheet(reservationData)

    return NextResponse.json({ 
      success: true, 
      message: 'Google Sheetsに正常に同期されました' 
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