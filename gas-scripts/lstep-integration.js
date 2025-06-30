/**
 * 🔥 Lステップ連携用 Google Apps Script
 * 既存のGASにLステップ連携機能を追加
 */

// ⚙️ Lステップ連携設定
const LSTEP_CONFIG = {
  TRIGGER_PREFIX: '#LSTEP_',           // Lステップが検出するプレフィックス
  SHEET_NAME: 'Lステップ連携',         // 連携用シート名
  CHECK_INTERVAL: 5,                   // Lステップのチェック間隔（分）
  
  // Lステップトリガーキーワード
  TRIGGERS: {
    BOOKING_COMPLETE: '#BOOKING_COMPLETE_',
    REMINDER_24H: '#REMINDER_24H_',
    CANCEL_REQUEST: '#CANCEL_REQUEST_',
    MEMBER_UPGRADE: '#MEMBER_UPGRADE_'
  }
}

/**
 * 📋 予約完了時のLステップ連携処理
 */
function onBookingComplete(bookingData) {
  try {
    // 1. Lステップトリガーメッセージを送信
    sendLstepTriggerMessage(bookingData)
    
    // 2. Lステップ連携シートに記録
    recordToLstepSheet(bookingData)
    
    // 3. プログラム別の処理
    handleProgramSpecificActions(bookingData)
    
    Logger.log('✅ Lステップ連携完了: ' + bookingData.顧客名)
  } catch (error) {
    Logger.log('❌ Lステップ連携エラー: ' + error.toString())
  }
}

/**
 * 💬 Lステップトリガーメッセージを送信
 */
function sendLstepTriggerMessage(bookingData) {
  const lineId = bookingData.LINE_ID
  
  if (!lineId) {
    Logger.log('⚠️ LINE IDが未設定のため、Lステップ連携をスキップ')
    return
  }
  
  // Lステップが検出する特殊フォーマット
  const triggerCode = LSTEP_CONFIG.TRIGGERS.BOOKING_COMPLETE + bookingData.予約ID
  
  // Flexメッセージで見た目は通常、データは埋め込み
  const message = {
    to: lineId,
    messages: [{
      type: 'flex',
      altText: '予約完了のお知らせ',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#4CAF50',
          paddingAll: '15px',
          contents: [{
            type: 'text',
            text: '✅ 予約が完了しました',
            color: '#FFFFFF',
            size: 'lg',
            weight: 'bold'
          }]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          paddingAll: '15px',
          contents: [
            {
              type: 'text',
              text: bookingData.顧客名 + ' 様',
              size: 'lg',
              weight: 'bold',
              color: '#333333'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '日時',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: bookingData.予約日時,
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'プログラム',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: bookingData.プログラム,
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'インストラクター',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: bookingData.インストラクター,
                  flex: 5
                }
              ]
            },
            // Lステップトリガー（透明文字）
            {
              type: 'text',
              text: triggerCode,
              size: 'xxs',
              color: '#FFFFFF',
              align: 'end',
              margin: 'none'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          paddingAll: '15px',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#4CAF50',
              action: {
                type: 'postback',
                label: 'マイページで確認',
                data: 'action=view_booking&id=' + bookingData.予約ID,
                displayText: 'マイページを見る'
              }
            }
          ]
        }
      }
    }]
  }
  
  // LINE Messaging API経由で送信
  sendLineMessage(message)
}

/**
 * 📊 Lステップ連携シートに記録
 */
function recordToLstepSheet(bookingData) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  let sheet = spreadsheet.getSheetByName(LSTEP_CONFIG.SHEET_NAME)
  
  // シートがなければ作成
  if (!sheet) {
    sheet = createLstepSheet(spreadsheet)
  }
  
  const data = [
    new Date(),                    // タイムスタンプ
    bookingData.LINE_ID,          // LINE ID
    bookingData.予約ID,           // 予約ID
    bookingData.顧客名,           // 顧客名
    bookingData.プログラム,       // プログラム
    bookingData.予約日時,         // 予約日時
    bookingData.開始時間,         // 開始時間
    'pending',                    // Lステップ処理状態
    '',                           // Lステップ処理日時
    JSON.stringify({              // 追加データ（JSON）
      instructor: bookingData.インストラクター,
      studio: bookingData.スタジオ,
      phone: bookingData.電話番号
    })
  ]
  
  sheet.appendRow(data)
}

/**
 * 📋 Lステップ連携シートを作成
 */
function createLstepSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(LSTEP_CONFIG.SHEET_NAME)
  
  const headers = [
    'タイムスタンプ',
    'LINE_ID',
    '予約ID',
    '顧客名',
    'プログラム',
    '予約日時',
    '開始時間',
    '処理状態',
    '処理日時',
    '追加データ'
  ]
  
  // ヘッダー設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length)
  headerRange.setValues([headers])
  headerRange.setBackground('#4CAF50')
  headerRange.setFontColor('#FFFFFF')
  headerRange.setFontWeight('bold')
  
  // 列幅調整
  sheet.setColumnWidth(1, 150) // タイムスタンプ
  sheet.setColumnWidth(2, 150) // LINE_ID
  sheet.setColumnWidth(10, 300) // 追加データ
  
  return sheet
}

/**
 * 🎯 プログラム別の特別処理
 */
function handleProgramSpecificActions(bookingData) {
  const program = bookingData.プログラム
  
  // ヨガ予約の場合
  if (program.includes('ヨガ')) {
    sendLstepKeyword(bookingData.LINE_ID, '#TAG_YOGA_MEMBER')
  }
  
  // HIIT予約の場合
  if (program.includes('HIIT')) {
    sendLstepKeyword(bookingData.LINE_ID, '#TAG_HIIT_MEMBER')
  }
  
  // 初回予約の場合
  if (isFirstBooking(bookingData.LINE_ID)) {
    sendLstepKeyword(bookingData.LINE_ID, '#SCENARIO_FIRST_BOOKING')
  }
}

/**
 * 🔄 Lステップからの定期取得用API
 * WebアプリとしてデプロイしてURLを取得
 */
function doGet(e) {
  const action = e.parameter.action || 'getPending'
  
  switch (action) {
    case 'getPending':
      return getPendingBookings()
    
    case 'markProcessed':
      return markAsProcessed(e.parameter.bookingId)
    
    case 'getStats':
      return getLstepStats()
    
    default:
      return createJsonOutput({ error: 'Invalid action' })
  }
}

/**
 * 📊 未処理の予約データを取得
 */
function getPendingBookings() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(LSTEP_CONFIG.SHEET_NAME)
  
  if (!sheet) {
    return createJsonOutput({ bookings: [] })
  }
  
  const data = sheet.getDataRange().getValues()
  const pendingBookings = []
  
  // ヘッダーをスキップしてデータを処理
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === 'pending') { // 処理状態
      pendingBookings.push({
        row: i + 1,
        timestamp: data[i][0],
        lineId: data[i][1],
        bookingId: data[i][2],
        customerName: data[i][3],
        program: data[i][4],
        bookingDateTime: data[i][5],
        startTime: data[i][6],
        additionalData: data[i][9] ? JSON.parse(data[i][9]) : {}
      })
    }
  }
  
  return createJsonOutput({
    bookings: pendingBookings,
    count: pendingBookings.length,
    timestamp: new Date()
  })
}

/**
 * ✅ 予約を処理済みにマーク
 */
function markAsProcessed(bookingId) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(LSTEP_CONFIG.SHEET_NAME)
  
  const data = sheet.getDataRange().getValues()
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == bookingId) { // 予約ID
      sheet.getRange(i + 1, 8).setValue('processed') // 処理状態
      sheet.getRange(i + 1, 9).setValue(new Date())  // 処理日時
      
      return createJsonOutput({
        success: true,
        bookingId: bookingId,
        processedAt: new Date()
      })
    }
  }
  
  return createJsonOutput({
    success: false,
    error: 'Booking not found'
  })
}

/**
 * 📈 Lステップ連携の統計情報
 */
function getLstepStats() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(LSTEP_CONFIG.SHEET_NAME)
  
  if (!sheet) {
    return createJsonOutput({ stats: {} })
  }
  
  const data = sheet.getDataRange().getValues()
  let pending = 0, processed = 0
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === 'pending') pending++
    if (data[i][7] === 'processed') processed++
  }
  
  return createJsonOutput({
    stats: {
      total: data.length - 1,
      pending: pending,
      processed: processed,
      lastUpdate: new Date()
    }
  })
}

/**
 * 🔧 ユーティリティ関数
 */
function createJsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function sendLstepKeyword(lineId, keyword) {
  if (!lineId) return
  
  const message = {
    to: lineId,
    messages: [{
      type: 'text',
      text: keyword
    }]
  }
  
  sendLineMessage(message)
}

function isFirstBooking(lineId) {
  // 予約履歴をチェックして初回かどうか判定
  // 実装は省略
  return false
}

/**
 * 📅 定期実行用トリガー（5分ごと）
 * トリガー設定方法：
 * 1. Apps Script エディタでトリガーアイコンをクリック
 * 2. 「トリガーを追加」
 * 3. 関数: checkAndProcessLstepQueue
 * 4. 時間ベース、分ベースタイマー、5分ごと
 */
function checkAndProcessLstepQueue() {
  // Lステップ側から呼ばれるAPIを待つか、
  // ここから能動的に処理することも可能
  Logger.log('Lステップキューチェック: ' + new Date())
}