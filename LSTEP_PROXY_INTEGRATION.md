# プロキシサーバ・GAS経由でのLステップ連携方法

## 📊 現在の構成
```
予約システム → プロキシサーバ → GAS → 公式LINE → ユーザー
```

## 🔄 Lステップ連携後の構成
```
予約システム → プロキシサーバ → GAS → 公式LINE → Lステップ → ユーザー
                                    ↓
                              Google Sheets
                                    ↑
                               Lステップ（定期参照）
```

## 🚀 実装方法

### 方法1: GASでLステップトリガーを埋め込む

#### 1. GASスクリプトの修正
```javascript
// google-apps-script.js の修正版

/**
 * 💬 Lステップ連携用の予約通知を送信
 */
function sendLstepTriggerNotification(bookingData) {
  try {
    // Lステップが検出する特殊フォーマット
    const lstepTrigger = `#BOOKING_COMPLETE_${bookingData.予約ID}`
    
    // 顧客のLINE IDに送信（公式LINE経由）
    const message = {
      type: 'text',
      text: `【予約完了】
${bookingData.顧客名}様の予約を承りました。

日時: ${bookingData.予約日時}
プログラム: ${bookingData.プログラム}

${lstepTrigger}` // Lステップがこれを検出
    }
    
    // 個別のLINE IDに送信
    sendToLineUser(bookingData.LINE_ID, message)
    
    // 同時にスプレッドシートにLステップ用データを記録
    recordLstepData(bookingData)
    
  } catch (error) {
    Logger.log('❌ Lステップ連携エラー: ' + error.toString())
  }
}

/**
 * 📊 Lステップ連携用データをスプレッドシートに記録
 */
function recordLstepData(bookingData) {
  const lstepSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName('Lステップ連携') || createLstepSheet()
  
  const data = [
    new Date(), // タイムスタンプ
    bookingData.LINE_ID,
    bookingData.予約ID,
    bookingData.顧客名,
    bookingData.プログラム,
    bookingData.予約日時,
    'pending', // Lステップ処理状態
    '' // Lステップ処理日時
  ]
  
  lstepSheet.appendRow(data)
}

/**
 * 📋 Lステップ連携シートを作成
 */
function createLstepSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  const sheet = spreadsheet.insertSheet('Lステップ連携')
  
  // ヘッダー設定
  const headers = [
    'タイムスタンプ',
    'LINE_ID',
    '予約ID',
    '顧客名',
    'プログラム',
    '予約日時',
    '処理状態',
    '処理日時'
  ]
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  return sheet
}
```

### 方法2: プロキシサーバでLステップ連携

#### プロキシサーバの設定
```javascript
// proxy-server.js
const express = require('express')
const axios = require('axios')
const app = express()

// 予約情報を受け取ってLステップトリガーを送信
app.post('/api/booking/complete', async (req, res) => {
  const bookingData = req.body
  
  try {
    // 1. Google Sheetsに記録（GAS経由）
    await recordToGoogleSheets(bookingData)
    
    // 2. 公式LINEで特殊メッセージ送信（Lステップトリガー）
    await sendLstepTriggerMessage(bookingData)
    
    // 3. Lステップ用のWebhookデータを準備
    await prepareLstepWebhook(bookingData)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Failed to process booking' })
  }
})

async function sendLstepTriggerMessage(bookingData) {
  // Flexメッセージに隠しデータを埋め込む
  const flexMessage = {
    type: 'flex',
    altText: '予約完了',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約が完了しました',
            weight: 'bold',
            size: 'xl'
          },
          // Lステップトリガー（透明テキスト）
          {
            type: 'text',
            text: `#LST_BOOK_${bookingData.id}_${bookingData.program}`,
            size: 'xxs',
            color: '#ffffff00' // 完全透明
          }
        ]
      }
    }
  }
  
  // LINE Messaging API経由で送信
  await lineClient.pushMessage(bookingData.lineId, flexMessage)
}
```

### 方法3: Google Sheets + Lステップ連携

#### 1. スプレッドシート構成
```
シート1: 予約管理（既存）
シート2: Lステップ連携
シート3: Lステップ処理履歴
```

#### 2. Lステップ側の設定
- **定期実行**: 5分ごとにGoogle Sheetsをチェック
- **処理フロー**:
  1. 「Lステップ連携」シートから未処理データを取得
  2. 各LINE IDに対してシナリオ実行
  3. 処理済みフラグを更新

#### 3. GASでAPI提供
```javascript
// Lステップから呼び出されるAPI
function doGet(e) {
  const action = e.parameter.action
  
  if (action === 'getPendingBookings') {
    return getPendingBookingsForLstep()
  } else if (action === 'markAsProcessed') {
    return markBookingAsProcessed(e.parameter.bookingId)
  }
  
  return ContentService.createTextOutput('Invalid action')
}

function getPendingBookingsForLstep() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName('Lステップ連携')
  
  const data = sheet.getDataRange().getValues()
  const pendingBookings = []
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'pending') { // 処理状態が pending
      pendingBookings.push({
        row: i + 1,
        timestamp: data[i][0],
        lineId: data[i][1],
        bookingId: data[i][2],
        customerName: data[i][3],
        program: data[i][4],
        bookingDateTime: data[i][5]
      })
    }
  }
  
  return ContentService.createTextOutput(
    JSON.stringify(pendingBookings)
  ).setMimeType(ContentService.MimeType.JSON)
}
```

## 🎯 推奨実装手順

### ステップ1: GASの改修
1. 既存のGASに「Lステップ連携」シートを追加
2. 予約時にLステップトリガーを含むメッセージを送信
3. WebアプリとしてデプロイしてAPIエンドポイント作成

### ステップ2: Lステップ側の設定
1. **キーワード応答**
   - `#BOOKING_COMPLETE_` → 予約完了シナリオ
   - `#LST_BOOK_` → 予約詳細の抽出

2. **外部連携**
   - Google Sheets APIまたはGAS WebアプリURL設定
   - 定期実行で未処理予約をチェック

3. **シナリオ設定**
   - 予約完了 → タグ付与 → リマインダー設定

### ステップ3: プロキシサーバの活用
```javascript
// 既存のプロキシサーバに追加
app.post('/api/lstep/trigger', async (req, res) => {
  const { lineId, action, data } = req.body
  
  // Lステップが反応するメッセージを生成
  const triggerMessage = generateLstepTrigger(action, data)
  
  // 公式LINE経由で送信
  await sendViaOfficialLine(lineId, triggerMessage)
  
  // Google Sheetsにも記録
  await recordToSheets(lineId, action, data)
  
  res.json({ success: true })
})
```

## 📋 メリット

1. **既存システムの活用**: プロキシサーバとGASをそのまま使える
2. **柔軟な連携**: Google Sheets経由で様々なデータ連携が可能
3. **Lステップ機能フル活用**: タグ付け、シナリオ、リッチメニュー切り替え

## 🔧 注意点

1. **遅延**: Google Sheets経由だと最大5分程度の遅延
2. **文字数制限**: Lステップトリガーは短く設計
3. **エラーハンドリング**: 各ステップでの失敗を考慮

この方法で、APIキーなしでもLステップ経由の高度な自動返信が実現できます！