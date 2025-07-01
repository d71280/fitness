// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'

interface ReservationData {
  bookingDate: string      // 予約した日
  customerName: string     // 顧客名（漢字）
  experienceDate: string   // 体験日
  programName: string      // プログラム名
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
      sheet = await doc.addSheet({ 
        title: 'シート1',
        headerValues: ['日付', '名前', '体験日', 'プログラム']
      })
    }

    // ヘッダーが存在しない場合は設定
    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(['日付', '名前', '体験日', 'プログラム'])
    }

    // 新しい予約データを追加
    await sheet.addRow({
      '日付': reservationData.bookingDate,
      '名前': reservationData.customerName,
      '体験日': reservationData.experienceDate,
      'プログラム': reservationData.programName
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
    if (!reservationData.customerName || !reservationData.experienceDate || !reservationData.programName) {
      return NextResponse.json(
        { error: '必須フィールド（顧客名、体験日、プログラム名）が不足しています' },
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