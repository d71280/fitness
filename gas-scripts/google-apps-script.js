/**
 * 🔥 フィットネス予約システム - Google Apps Script
 * スプレッドシートの変更を監視して、グループLINEに通知を送信
 */

// ⚙️ 設定定数
const CONFIG = {
  LINE_GROUP_TOKEN: 'YOUR_LINE_GROUP_ACCESS_TOKEN', // グループLINE Bot のアクセストークン
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',            // スプレッドシートID
  WEBHOOK_URL: 'YOUR_NEXTJS_APP_URL/api/webhook/gas', // Next.js側のWebhook URL
  SHEET_NAME: '予約管理'                              // 監視するシート名
}

/**
 * 📋 スプレッドシートの変更時に実行される関数
 * インストール手順：
 * 1. スプレッドシートを開く
 * 2. 拡張機能 → Apps Script
 * 3. このコードを貼り付け
 * 4. トリガーを設定（編集時）
 */
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet()
    
    // 予約管理シートの変更のみ処理
    if (sheet.getName() !== CONFIG.SHEET_NAME) {
      return
    }

    const range = e.range
    const row = range.getRow()
    
    // ヘッダー行は無視
    if (row === 1) {
      return
    }

    // 新しい行が追加された場合（新規予約）
    if (range.getColumn() === 1 && range.getValue()) {
      const bookingData = getBookingDataFromRow(sheet, row)
      
      if (bookingData.予約ID) {
        sendGroupLineNotification(bookingData)
        Logger.log('✅ 新規予約通知を送信: ' + bookingData.顧客名)
      }
    }
  } catch (error) {
    Logger.log('❌ onEdit エラー: ' + error.toString())
  }
}

/**
 * 📊 指定行から予約データを取得
 */
function getBookingDataFromRow(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 11).getValues()[0]
  
  return {
    予約ID: values[0],
    予約日時: values[1],
    顧客名: values[2],
    電話番号: values[3],
    プログラム: values[4],
    インストラクター: values[5],
    スタジオ: values[6],
    開始時間: values[7],
    終了時間: values[8],
    ステータス: values[9],
    LINE_ID: values[10]
  }
}

/**
 * 💬 グループLINEに予約通知を送信
 */
function sendGroupLineNotification(bookingData) {
  try {
    const message = createBookingNotificationMessage(bookingData)
    
    const payload = {
      messages: [message]
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.LINE_GROUP_TOKEN
      },
      payload: JSON.stringify(payload)
    }

    // LINE Messaging API でグループに送信
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options)
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ グループLINE通知送信成功')
    } else {
      Logger.log('❌ グループLINE通知送信失敗: ' + response.getContentText())
    }
  } catch (error) {
    Logger.log('❌ グループLINE通知エラー: ' + error.toString())
  }
}

/**
 * 📝 予約通知メッセージを作成
 */
function createBookingNotificationMessage(data) {
  const date = new Date(data.予約日時)
  const formattedDate = Utilities.formatDate(date, 'Asia/Tokyo', 'M月d日(E)')
  
  // Flexメッセージで見やすい通知を作成
  return {
    type: 'flex',
    altText: `🆕 新規予約: ${data.顧客名}様 - ${data.プログラム}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '🆕 新規予約通知',
          weight: 'bold',
          color: '#ffffff',
          size: 'lg'
        }],
        backgroundColor: '#FF6B35',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: data.プログラム,
            weight: 'bold',
            size: 'xl',
            color: '#333333'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '👤', flex: 1 },
                  { type: 'text', text: data.顧客名, flex: 4, color: '#666666' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '📅', flex: 1 },
                  { type: 'text', text: formattedDate, flex: 4, color: '#666666' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '⏰', flex: 1 },
                  { type: 'text', text: `${data.開始時間} - ${data.終了時間}`, flex: 4, color: '#666666' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '👨‍🏫', flex: 1 },
                  { type: 'text', text: data.インストラクター, flex: 4, color: '#666666' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '🏢', flex: 1 },
                  { type: 'text', text: data.スタジオ, flex: 4, color: '#666666' }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `予約ID: ${data.予約ID}`,
            size: 'xs',
            color: '#999999',
            align: 'center'
          }
        ]
      }
    }
  }
}

/**
 * 🧪 テスト関数 - 手動実行用
 */
function testNotification() {
  const testData = {
    予約ID: 999,
    予約日時: new Date().toISOString(),
    顧客名: 'テスト 太郎',
    電話番号: '090-1234-5678',
    プログラム: 'テストヨガ',
    インストラクター: 'テスト先生',
    スタジオ: 'テストスタジオ',
    開始時間: '10:00',
    終了時間: '11:00',
    ステータス: 'confirmed',
    LINE_ID: 'test_line_id'
  }
  
  sendGroupLineNotification(testData)
  Logger.log('🧪 テスト通知を送信しました')
}

/**
 * 📊 今日の予約一覧をグループに送信
 */
function sendTodayBookings() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME)
    const data = sheet.getDataRange().getValues()
    const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')
    
    const todayBookings = data.slice(1).filter(row => {
      const bookingDate = new Date(row[1])
      const bookingDateStr = Utilities.formatDate(bookingDate, 'Asia/Tokyo', 'yyyy-MM-dd')
      return bookingDateStr === today
    })

    if (todayBookings.length === 0) {
      return
    }

    let message = `📅 今日の予約一覧 (${todayBookings.length}件)\n\n`
    
    todayBookings.forEach((booking, index) => {
      message += `${index + 1}. ${booking[2]} - ${booking[4]}\n`
      message += `   ${booking[7]} - ${booking[8]} (${booking[6]})\n\n`
    })

    // シンプルなテキストメッセージで送信
    sendSimpleGroupMessage(message)
    
  } catch (error) {
    Logger.log('❌ 今日の予約一覧送信エラー: ' + error.toString())
  }
}

/**
 * 💬 シンプルなテキストメッセージを送信
 */
function sendSimpleGroupMessage(text) {
  const payload = {
    messages: [{
      type: 'text',
      text: text
    }]
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.LINE_GROUP_TOKEN
    },
    payload: JSON.stringify(payload)
  }

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options)
} 