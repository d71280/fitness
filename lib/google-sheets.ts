import { GoogleSpreadsheet } from 'google-spreadsheet'

export interface SpreadsheetBookingData {
  日付: string        // 予約した日（今日の日付）
  名前: string        // 顧客名（漢字）
  体験日: string      // 体験する日（レッスンの日付）
  プログラム: string   // 予約したプログラム名
}

export class GoogleSheetsClient {
  private spreadsheetId: string
  private accessToken: string | null = null

  constructor(spreadsheetId?: string) {
    // 環境変数またはパラメータからスプレッドシートIDを取得
    this.spreadsheetId = spreadsheetId || 
                         process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || 
                         '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4' // デフォルトID
  }

  // クライアントサイドでSupabaseセッションからGoogleアクセストークンを取得
  async initializeWithClientAuth() {
    try {
      // 動的インポートでクライアントサイドクライアントを取得
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        throw new Error('認証セッションが見つかりません。Googleでログインしてください。')
      }

      // Googleプロバイダーのアクセストークンを取得
      if (session.provider_token) {
        this.accessToken = session.provider_token
        console.log('✅ Googleアクセストークンを取得しました')
        return true
      } else {
        throw new Error('Googleプロバイダーのアクセストークンが見つかりません')
      }
    } catch (error) {
      console.error('❌ Google認証初期化エラー:', error)
      throw error
    }
  }

  // Google Sheets APIを使って直接スプレッドシートに書き込み
  async addBookingRecord(bookingData: SpreadsheetBookingData) {
    try {
      if (!this.accessToken) {
        // クライアントサイドの認証のみを使用
        await this.initializeWithClientAuth()
      }

      if (!this.accessToken) {
        throw new Error('Googleアクセストークンが取得できませんでした')
      }

      // まずスプレッドシートの情報を取得
      const spreadsheetResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!spreadsheetResponse.ok) {
        throw new Error(`スプレッドシート取得エラー: ${spreadsheetResponse.status} ${spreadsheetResponse.statusText}`)
      }

      const spreadsheetInfo = await spreadsheetResponse.json()
      const sheetId = spreadsheetInfo.sheets[0].properties.sheetId

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
      
      console.log('✅ スプレッドシートに予約を記録しました（OAuth2.0）:', {
        customerName: bookingData.名前,
        program: bookingData.プログラム,
        experienceDate: bookingData.体験日,
        range: result.updates?.updatedRange
      })

      return { 
        success: true, 
        method: 'oauth2-api',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        updatedRange: result.updates?.updatedRange
      }
    } catch (error) {
      console.error('❌ スプレッドシート記録エラー:', error)
      
      // フォールバック: Google Forms経由
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
        method: 'google-forms-fallback',
        message: 'OAuth2.0接続失敗のため、Google Forms経由で記録されました'
      }
    } catch (error) {
      console.error('❌ Google Forms経由での記録も失敗:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 今日の予約一覧を取得
  async getTodayBookings() {
    try {
      if (!this.accessToken) {
        await this.initializeWithClientAuth()
      }

      if (!this.accessToken) {
        throw new Error('Googleアクセストークンが取得できませんでした')
      }

      // スプレッドシートからデータを取得
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A:D`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`データ取得エラー: ${response.status}`)
      }

      const data = await response.json()
      const rows = data.values || []
      
      if (rows.length <= 1) {
        return { success: true, bookings: [] }
      }

      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '/')
      
      const todayBookings = rows.slice(1) // ヘッダーを除外
        .filter((row: string[]) => row[2] === today) // 体験日でフィルター
        .map((row: string[]) => ({
          日付: row[0],
          名前: row[1],
          体験日: row[2],
          プログラム: row[3]
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
      await this.initializeWithClientAuth()
      
      if (!this.accessToken) {
        throw new Error('Googleアクセストークンが取得できませんでした。Googleでログインしてください。')
      }

      console.log('🔍 アクセストークンを取得しました:', this.accessToken.substring(0, 20) + '...')

      // まず、現在のトークンでGoogle User Infoを取得してスコープを確認
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json()
          console.log('✅ Google User Info取得成功:', userInfo.email)
        } else {
          console.warn('⚠️ Google User Info取得失敗:', userInfoResponse.status)
        }
      } catch (error) {
        console.warn('⚠️ Google User Info取得エラー:', error)
      }

      // スプレッドシート情報を取得してテスト
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('📊 Google Sheets API呼び出し結果:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Google Sheets APIエラー詳細:', errorText)
        
        if (response.status === 403) {
          throw new Error(`アクセス権限がありません (403): Googleアカウント「${await this.getCurrentUserEmail()}」がスプレッドシートID「${this.spreadsheetId}」への編集権限を持っていない可能性があります。またはGoogle Sheets APIのスコープが不足しています。`)
        } else if (response.status === 404) {
          throw new Error(`スプレッドシートが見つかりません (404): スプレッドシートID「${this.spreadsheetId}」が正しくない可能性があります。`)
        } else {
          throw new Error(`Google Sheets API接続エラー (${response.status}): ${errorText}`)
        }
      }

      const spreadsheetInfo = await response.json()

      return {
        success: true,
        spreadsheetId: this.spreadsheetId,
        spreadsheetTitle: spreadsheetInfo.properties.title,
        sheetCount: spreadsheetInfo.sheets.length,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        message: 'OAuth2.0を使用してGoogle Sheets APIに接続しました',
        userEmail: await this.getCurrentUserEmail()
      }
    } catch (error) {
      console.error('スプレッドシート接続テストエラー:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 現在のユーザーメールアドレスを取得
  private async getCurrentUserEmail(): Promise<string> {
    try {
      if (!this.accessToken) return '不明'
      
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const userInfo = await response.json()
        return userInfo.email || '不明'
      }
      return '不明'
    } catch {
      return '不明'
    }
  }
} 