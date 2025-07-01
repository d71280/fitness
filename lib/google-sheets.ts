import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export interface SpreadsheetBookingData {
  日付: string        // 予約した日（今日の日付）
  名前: string        // 顧客名（漢字）
  体験日: string      // 体験する日（レッスンの日付）
  プログラム: string   // 予約したプログラム名
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
      
      // 最初のシートを取得、なければ作成
      let sheet = this.doc.sheetsByIndex[0]
      if (!sheet) {
        sheet = await this.doc.addSheet({ 
          title: 'シート1',
          headerValues: ['日付', '名前', '体験日', 'プログラム']
        })
      }

      // ヘッダーが設定されていない場合は設定
      if (!sheet.headerValues || sheet.headerValues.length === 0) {
        await sheet.setHeaderRow(['日付', '名前', '体験日', 'プログラム'])
      }

      // 新しい行を追加
      const newRow = await sheet.addRow({
        '日付': bookingData.日付,
        '名前': bookingData.名前,
        '体験日': bookingData.体験日,
        'プログラム': bookingData.プログラム
      })
      
      console.log('✅ スプレッドシートに予約を記録しました:', {
        rowNumber: newRow.rowNumber,
        customerName: bookingData.名前,
        program: bookingData.プログラム,
        experienceDate: bookingData.体験日
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
      const sheet = this.doc.sheetsByIndex[0]
      if (!sheet) {
        return { success: true, bookings: [] }
      }

      const rows = await sheet.getRows()
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '/')
      
      const todayBookings = rows
        .filter(row => row.get('体験日') === today)
        .map(row => ({
          名前: row.get('名前'),
          プログラム: row.get('プログラム'),
          体験日: row.get('体験日')
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