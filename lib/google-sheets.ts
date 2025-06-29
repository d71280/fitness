import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export interface SpreadsheetBookingData {
  予約ID: number
  予約日時: string
  顧客名: string
  電話番号: string
  プログラム: string
  インストラクター: string
  スタジオ: string
  開始時間: string
  終了時間: string
  ステータス: string
  LINE_ID: string
}

export class GoogleSheetsClient {
  private doc: GoogleSpreadsheet
  private serviceAccountAuth: JWT

  constructor() {
    // サービスアカウント認証の設定
    this.serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    })

    // スプレッドシートドキュメントの初期化
    this.doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SPREADSHEET_ID!,
      this.serviceAccountAuth
    )
  }

  // スプレッドシートに予約データを追加
  async addBookingRecord(bookingData: SpreadsheetBookingData) {
    try {
      await this.doc.loadInfo()
      
      // 予約管理シートを取得（存在しない場合は作成）
      let sheet = this.doc.sheetsByTitle['予約管理']
      if (!sheet) {
        sheet = await this.doc.addSheet({
          title: '予約管理',
          headerValues: Object.keys(bookingData)
        })
      }

      // ヘッダーが設定されていない場合は設定
      if (!sheet.headerValues || sheet.headerValues.length === 0) {
        await sheet.setHeaderRow(Object.keys(bookingData))
      }

      // 新しい行を追加（型を明示的にキャスト）
      const newRow = await sheet.addRow(bookingData as any)
      
      console.log('✅ スプレッドシートに予約を記録しました:', {
        rowNumber: newRow.rowNumber,
        bookingId: bookingData.予約ID,
        customerName: bookingData.顧客名
      })

      return { 
        success: true, 
        rowNumber: newRow.rowNumber,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.doc.spreadsheetId}/edit#gid=${sheet.sheetId}`
      }
    } catch (error) {
      console.error('❌ スプレッドシート記録エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 今日の予約一覧を取得
  async getTodayBookings() {
    try {
      await this.doc.loadInfo()
      const sheet = this.doc.sheetsByTitle['予約管理']
      if (!sheet) {
        return { success: true, bookings: [] }
      }

      const rows = await sheet.getRows()
      const today = new Date().toISOString().split('T')[0]
      
      const todayBookings = rows
        .filter(row => row.get('予約日時').startsWith(today))
        .map(row => ({
          予約ID: row.get('予約ID'),
          顧客名: row.get('顧客名'),
          プログラム: row.get('プログラム'),
          開始時間: row.get('開始時間'),
          スタジオ: row.get('スタジオ')
        }))

      return { success: true, bookings: todayBookings }
    } catch (error) {
      console.error('今日の予約取得エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // スプレッドシート接続テスト
  async testConnection() {
    try {
      await this.doc.loadInfo()
      
      return {
        success: true,
        spreadsheetTitle: this.doc.title,
        sheetCount: this.doc.sheetCount,
        spreadsheetId: this.doc.spreadsheetId
      }
    } catch (error) {
      console.error('スプレッドシート接続テストエラー:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 