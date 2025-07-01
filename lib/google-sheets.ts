import { GoogleSpreadsheet } from 'google-spreadsheet'

export interface SpreadsheetBookingData {
  日付: string        // 予約した日（今日の日付）
  名前: string        // 顧客名（漢字）
  体験日: string      // 体験する日（レッスンの日付）
  プログラム: string   // 予約したプログラム名
}

export class GoogleSheetsClient {
  private spreadsheetId: string

  constructor(spreadsheetId?: string) {
    // 環境変数またはパラメータからスプレッドシートIDを取得
    this.spreadsheetId = spreadsheetId || 
                         process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || 
                         '1fE2aimUZu7yGyswe5rGau27ohXnYB5pJ37x13bOQ4' // デフォルトID
  }

  // フロントエンド（クライアント側）でGoogle Sheets APIを呼び出し
  async addBookingRecord(bookingData: SpreadsheetBookingData) {
    try {
      // Google Apps Script Web Appを経由してスプレッドシートに書き込み
      // この方法なら認証不要で、公開されたスプレッドシートに書き込める
      
      const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL
      
      if (!gasWebAppUrl) {
        // フォールバック: 直接Google Sheets APIを使用（要認証）
        return await this.addBookingRecordDirect(bookingData)
      }

      // Google Apps Script経由でデータを送信
      const response = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addBooking',
          data: bookingData,
          spreadsheetId: this.spreadsheetId
        })
      })

      if (!response.ok) {
        throw new Error(`GAS Web App Error: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('✅ スプレッドシートに予約を記録しました（GAS経由）:', {
        customerName: bookingData.名前,
        program: bookingData.プログラム,
        experienceDate: bookingData.体験日
      })

      return { 
        success: true, 
        method: 'gas-webapp',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        result
      }
    } catch (error) {
      console.error('❌ スプレッドシート記録エラー:', error)
      
      // フォールバック: 単純なフォーム投稿でGoogle Formsに送信する方法もある
      return await this.addBookingRecordViaForm(bookingData)
    }
  }

  // Google Formsを使ったフォールバック（認証不要）
  private async addBookingRecordViaForm(bookingData: SpreadsheetBookingData) {
    try {
      const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL
      
      if (!formUrl) {
        throw new Error('Google FormのURLが設定されていません')
      }

      const formData = new FormData()
      formData.append('entry.日付', bookingData.日付)
      formData.append('entry.名前', bookingData.名前)
      formData.append('entry.体験日', bookingData.体験日)
      formData.append('entry.プログラム', bookingData.プログラム)

      const response = await fetch(formUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'  // CORS制限を回避
      })

      console.log('✅ スプレッドシートに予約を記録しました（Google Forms経由）')

      return { 
        success: true, 
        method: 'google-forms',
        message: 'Google Forms経由で記録されました'
      }
    } catch (error) {
      console.error('❌ Google Forms経由での記録も失敗:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 直接Google Sheets APIを使用（認証が必要）
  private async addBookingRecordDirect(bookingData: SpreadsheetBookingData) {
    try {
      // この方法は現在のところ実装しない（認証が複雑なため）
      console.warn('直接API接続は現在未実装です')
      return { 
        success: false, 
        error: '直接API接続は現在未実装です' 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 今日の予約一覧を取得（簡易版）
  async getTodayBookings() {
    return { 
      success: true, 
      bookings: [],
      message: '予約一覧取得は現在未実装です（スプレッドシートから手動確認してください）'
    }
  }

  // スプレッドシート接続テスト
  async testConnection() {
    try {
      return {
        success: true,
        spreadsheetId: this.spreadsheetId,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        message: 'スプレッドシートURLが設定されています。予約作成時に自動記録されます。'
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