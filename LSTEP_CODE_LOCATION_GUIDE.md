# Lステップ連携コードの設置場所ガイド

## 📍 コードをどこに設置するか

### 1. **GAS（Google Apps Script）に設置するコード**

#### 📝 `gas-scripts/lstep-integration.js`
```javascript
// ✅ GASに設置
function onBookingComplete(bookingData) {
  // Lステップトリガーメッセージを送信
  sendLstepTriggerMessage(bookingData)
  
  // Lステップ連携シートに記録
  recordToLstepSheet(bookingData)
}

// ✅ GASに設置 - Lステップが呼び出すAPI
function doGet(e) {
  const action = e.parameter.action
  if (action === 'getPending') {
    return getPendingBookings()
  }
}
```

**設置方法:**
1. Google Sheetsを開く
2. 拡張機能 → Apps Script
3. 既存のコードに追加
4. デプロイ → ウェブアプリとして導入

---

### 2. **プロキシサーバーに設置するコード**

#### 📝 プロキシサーバー（Node.js/Express）
```javascript
// ✅ プロキシサーバーに設置
app.post('/api/booking/complete', async (req, res) => {
  const bookingData = req.body
  
  // GASのWebhookを呼び出す
  await axios.post(GAS_WEBHOOK_URL, {
    action: 'sendLstepTrigger',
    bookingData: bookingData
  })
  
  res.json({ success: true })
})

// ✅ プロキシサーバーに設置 - Lステップからのコールバック
app.post('/webhook/lstep/callback', (req, res) => {
  // Lステップからの通知を処理
  const { lineId, action, data } = req.body
  console.log('Lステップコールバック:', action)
  res.json({ received: true })
})
```

---

### 3. **Next.jsアプリ（このリポジトリ）に設置するコード**

#### 📝 `app/api/liff/booking/route.ts`
```typescript
// ✅ Next.jsアプリに設置
export async function POST(request: NextRequest) {
  // LIFF予約処理
  const booking = await createBooking(data)
  
  // プロキシサーバー経由でGASに送信
  await fetch('https://your-proxy.com/api/booking/complete', {
    method: 'POST',
    body: JSON.stringify(booking)
  })
}
```

#### 📝 `components/liff/BookingForm.tsx`
```typescript
// ✅ Next.jsアプリに設置（フロントエンド）
async function completeBookingInLIFF() {
  // LIFFからLステップトリガー送信
  await liff.sendMessages([{
    type: 'text',
    text: `#LIFF_BOOKING_${booking.id}`
  }])
}
```

---

### 4. **Lステップ管理画面で設定する内容**

#### 📝 Lステップ側の設定（コードではなく画面操作）
```
1. キーワード応答設定
   - キーワード: #LIFF_BOOKING_
   - アクション: タグ付与、シナリオ開始

2. 外部連携設定
   - 連携URL: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   - 実行間隔: 5分

3. Webhook設定（もしAPIが使える場合）
   - URL: https://your-proxy.com/webhook/lstep/callback
```

---

## 🏗️ アーキテクチャ図

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│プロキシサーバ│────▶│    GAS      │
│  (LIFFも)   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                         │
       │                                         ▼
       │                                  ┌─────────────┐
       │                                  │Google Sheets│
       │                                  └─────────────┘
       │                                         ▲
       │                                         │
       ▼                                         │
┌─────────────┐                          ┌─────────────┐
│ 公式LINE    │─────────────────────────▶│  Lステップ  │
│             │  メッセージ＋トリガー      │             │
└─────────────┘                          └─────────────┘
```

---

## 🚀 実装の優先順位

### Phase 1: 最小構成（GASのみ）
```javascript
// GASに追加するだけ
function sendLstepTriggerMessage(bookingData) {
  // 既存のLINE送信処理に1行追加
  const trigger = `#BOOKING_${bookingData.予約ID}`
  // メッセージ本文に含める
}
```

### Phase 2: プロキシサーバー連携
```javascript
// プロキシサーバーでGAS呼び出し
app.post('/api/lstep/trigger', async (req, res) => {
  await callGASWebhook(req.body)
})
```

### Phase 3: LIFF統合
```typescript
// LIFF内でトリガー送信
await liff.sendMessages([{
  type: 'text',
  text: `#LIFF_BOOKING_${booking.id}`
}])
```

---

## 📋 チェックリスト

### GAS側
- [ ] `lstep-integration.js`を既存のGASに追加
- [ ] Lステップ連携シートを作成
- [ ] WebアプリとしてデプロイしてURLを取得

### プロキシサーバー側
- [ ] Lステップトリガー送信エンドポイント追加
- [ ] GAS WebhookのURLを環境変数に設定

### Next.js側
- [ ] LIFF予約完了時にトリガー送信追加
- [ ] プロキシサーバーのエンドポイントを呼び出し

### Lステップ側
- [ ] キーワード応答を設定
- [ ] 外部連携URLを設定（GAS URL）
- [ ] シナリオを作成

---

## 🔧 環境変数の例

### プロキシサーバー
```env
GAS_WEBHOOK_URL=https://script.google.com/macros/s/xxx/exec
LSTEP_CALLBACK_SECRET=your-secret-key
```

### Next.js
```env
PROXY_SERVER_URL=https://your-proxy.com
NEXT_PUBLIC_LIFF_ID=your-liff-id
```

### GAS
```javascript
const CONFIG = {
  SPREADSHEET_ID: 'your-spreadsheet-id',
  LINE_ACCESS_TOKEN: 'your-line-token'
}
```