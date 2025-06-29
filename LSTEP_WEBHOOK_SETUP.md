# Lステップ Webhook連携の仕組み

## 📊 情報連携の全体像

### 1. 双方向の情報フロー

```
【予約システム → Lステップ】
- 予約情報の送信
- 顧客情報の更新
- イベントトリガー

【Lステップ → 予約システム】
- ユーザーアクション通知
- メッセージ開封/クリック情報
- 返信メッセージ
```

## 🔄 具体的な連携パターン

### パターン1: 予約完了時の連携
```mermaid
予約システム → Lステップ API
  └→ 顧客タグ付け（「ヨガ予約済み」）
  └→ シナリオ開始（予約確認フロー）
  └→ スコア加算（ロイヤリティポイント）
```

### パターン2: ユーザー返信時の連携
```mermaid
ユーザー → LINE → Lステップ → Webhook → 予約システム
  └→ キャンセル希望の自動処理
  └→ 質問の管理画面表示
  └→ アンケート回答の記録
```

## 🔧 Webhook設定

### 1. Lステップ側の設定
```
管理画面 > 連携設定 > Webhook
- URL: https://your-domain.com/api/webhook/lstep
- 認証キー: [自動生成される]
- イベント選択:
  ✓ メッセージ受信
  ✓ タグ付与/削除
  ✓ シナリオ完了
  ✓ リッチメニュークリック
```

### 2. 環境変数の設定
```env
# Lステップ Webhook設定
LSTEP_WEBHOOK_SECRET="lstep-webhook-secret-key"
LSTEP_WEBHOOK_VERIFY_TOKEN="verify-token-from-lstep"

# Lステップ API設定
LSTEP_API_KEY="your-lstep-api-key"
LSTEP_API_URL="https://api.lstep.app/v1"
LSTEP_ACCOUNT_ID="your-account-id"
```

## 🚀 実装済みWebhookエンドポイント

### `/api/webhook/lstep/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. 署名検証
    const signature = headers().get('x-lstep-signature')
    const body = await request.text()
    
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const event = JSON.parse(body)
    
    // 2. イベントタイプ別処理
    switch (event.type) {
      case 'message.received':
        await handleMessageReceived(event)
        break
        
      case 'tag.added':
        await handleTagAdded(event)
        break
        
      case 'scenario.completed':
        await handleScenarioCompleted(event)
        break
        
      case 'richmenu.clicked':
        await handleRichMenuClicked(event)
        break
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook処理エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 📋 連携データの例

### 1. 予約システム → Lステップ
```json
{
  "action": "add_tags",
  "line_id": "U1234567890abcdef",
  "tags": ["ヨガ予約", "2025年6月予約", "新規顧客"],
  "custom_fields": {
    "last_booking_date": "2025-06-30",
    "total_bookings": 5,
    "preferred_program": "ヨガ",
    "membership_level": "premium"
  },
  "trigger_scenario": "booking_confirmation_flow"
}
```

### 2. Lステップ → 予約システム（Webhook）
```json
{
  "type": "message.received",
  "timestamp": "2025-06-29T10:30:00Z",
  "user": {
    "line_id": "U1234567890abcdef",
    "display_name": "田中太郎",
    "tags": ["ヨガ予約", "リピーター"],
    "custom_fields": {
      "total_bookings": 5
    }
  },
  "message": {
    "type": "text",
    "text": "明日の予約をキャンセルしたいです",
    "id": "msg_12345"
  }
}
```

## 🎯 活用例

### 1. 自動キャンセル処理
```typescript
// ユーザーが「キャンセル」を含むメッセージを送信
if (message.text.includes('キャンセル')) {
  // 最新の予約を検索
  const reservation = await findLatestReservation(user.line_id)
  
  // キャンセル確認メッセージを送信
  await lstepClient.sendQuickReply(user.line_id, {
    text: `${reservation.program}の予約をキャンセルしますか？`,
    actions: [
      { label: 'はい', data: `cancel_${reservation.id}` },
      { label: 'いいえ', data: 'cancel_no' }
    ]
  })
}
```

### 2. 顧客セグメント自動更新
```typescript
// シナリオ完了時
if (event.type === 'scenario.completed' && event.scenario_id === 'onboarding') {
  // 顧客情報を更新
  await updateCustomer(event.user.line_id, {
    onboarding_completed: true,
    tags: ['オンボーディング完了']
  })
}
```

### 3. リッチメニュー連携
```typescript
// リッチメニューのクリック
if (event.type === 'richmenu.clicked') {
  switch (event.action) {
    case 'book_class':
      // 予約画面のURLを送信
      await lstepClient.sendMessage(event.user.line_id, {
        type: 'text',
        text: '予約はこちらから👇\nhttps://your-domain.com/booking'
      })
      break
      
    case 'check_schedule':
      // 今週のスケジュールを送信
      await sendWeeklySchedule(event.user.line_id)
      break
  }
}
```

## 🔐 セキュリティ対策

### 1. 署名検証
```typescript
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.LSTEP_WEBHOOK_SECRET!
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return hash === signature
}
```

### 2. IPアドレス制限
```typescript
// Lステップの固定IPからのみ許可
const allowedIPs = ['1.2.3.4', '5.6.7.8'] // Lステップ提供のIP
const clientIP = request.headers.get('x-forwarded-for')

if (!allowedIPs.includes(clientIP)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## 📈 分析データの活用

### Lステップから取得できるデータ
- **開封率**: メッセージを開いた割合
- **クリック率**: リンクやボタンのクリック率
- **返信率**: メッセージへの返信率
- **滞在時間**: リッチメニューの利用時間
- **離脱ポイント**: シナリオの離脱地点

### 予約システムへの反映
```typescript
// 分析データを定期的に同期
async function syncAnalytics() {
  const analytics = await lstepClient.getAnalytics({
    start_date: '2025-06-01',
    end_date: '2025-06-30'
  })
  
  // 顧客エンゲージメントスコアの更新
  for (const user of analytics.users) {
    await updateCustomerScore(user.line_id, {
      engagement_score: user.open_rate * 0.3 + user.click_rate * 0.7,
      last_active: user.last_interaction
    })
  }
}
```

## 🎨 リッチメニューの設定例

### 予約システム用リッチメニュー
```
┌─────────┬─────────┐
│ 予約する │スケジュール│
├─────────┼─────────┤
│マイページ│ お問合せ  │
└─────────┴─────────┘
```

各ボタンのアクション設定：
- **予約する**: Webhook経由で予約画面URLを送信
- **スケジュール**: 今週のクラススケジュールを表示
- **マイページ**: 予約履歴とポイント残高を表示
- **お問合せ**: AIチャットボットまたは人間のオペレーターへ

## 🚦 実装ステップ

1. **Lステップアカウント設定**
   - Webhook URL登録
   - 認証キー取得
   - イベント選択

2. **予約システム側実装**
   - Webhookエンドポイント作成
   - 署名検証実装
   - イベントハンドラー作成

3. **テスト**
   - Lステップのテスト送信機能を使用
   - ログ確認
   - エラーハンドリング確認

4. **本番運用**
   - モニタリング設定
   - エラー通知設定
   - 分析ダッシュボード構築