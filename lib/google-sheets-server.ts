import { SpreadsheetBookingData } from './google-sheets'

// サーバーサイド専用のGoogle Sheetsクライアント
export class GoogleSheetsServerClient {
  private spreadsheetId: string
  private accessToken: string | null = null

  constructor(spreadsheetId?: string) {
    this.spreadsheetId = spreadsheetId || 
                         process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || 
                         '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
  }

  // サーバーサイドでSupabaseセッションからGoogleアクセストークンを取得
  async initializeWithServerAuth() {
    try {
      // サーバーサイドでのSupabaseセッション取得
      const { createClient } = await import('@/utils/supabase/server')
      const supabase = await createClient()
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        throw new Error('認証セッションが見つかりません')
      }

      // Googleプロバイダーのアクセストークンを取得
      if (session.provider_token) {
        this.accessToken = session.provider_token
        console.log('✅ Googleアクセストークンを取得しました（サーバーサイド）')
        return true
      } else {
        throw new Error('Googleプロバイダーのアクセストークンが見つかりません')
      }
    } catch (error) {
      console.error('❌ Google認証初期化エラー（サーバーサイド）:', error)
      throw error
    }
  }

  // Google Sheets APIを使って直接スプレッドシートに書き込み（サーバーサイド専用）
  async addBookingRecord(bookingData: SpreadsheetBookingData) {
    try {
      if (!this.accessToken) {
        await this.initializeWithServerAuth()
      }

      if (!this.accessToken) {
        throw new Error('Googleアクセストークンが取得できませんでした')
      }

      // ヘッダー行が存在するかチェック
      const rangeResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A1:D1`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const rangeData = await rangeResponse.json()
      
      // ヘッダーが存在しない場合は設定
      if (!rangeData.values || rangeData.values.length === 0) {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A1:D1?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
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
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A:D:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
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
      
      console.log('✅ スプレッドシートに予約を記録しました（OAuth2.0サーバーサイド）:', {
        customerName: bookingData.名前,
        program: bookingData.プログラム,
        experienceDate: bookingData.体験日,
        range: result.updates?.updatedRange
      })
      
      return { 
        success: true, 
        method: 'oauth2-api-server',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        updatedRange: result.updates?.updatedRange
      }
    } catch (error) {
      console.error('❌ サーバーサイドスプレッドシート記録エラー:', error)
      
      // フォールバック処理
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
} 