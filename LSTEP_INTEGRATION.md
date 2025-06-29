# Lステップ連携ガイド

## 概要
公式LINE直送信からLステップ経由送信への切り替えが可能な統合メッセージングシステムを実装しました。

## 🔄 現在の仕組み vs Lステップ経由

### Before: 公式LINE直送信
```
予約システム → LINE Messaging API → ユーザー
```

### After: Lステップ経由
```
予約システム → Lステップ API → LINE → ユーザー
```

## ✨ Lステップ経由のメリット

### 1. 高機能なメッセージ配信
- **リッチメッセージ**: Flexメッセージで美しい予約確認
- **配信時間制御**: 最適な時間に自動配信
- **配信結果分析**: 開封率・クリック率の詳細分析

### 2. マーケティング機能
- **シナリオ配信**: 予約→リマインダー→アフターフォローの自動化
- **セグメント配信**: 会員ランク別・プログラム別の配信
- **A/Bテスト**: メッセージ内容の効果測定

### 3. 顧客管理強化
- **行動トラッキング**: 予約・キャンセル・来店の履歴管理
- **タグ管理**: 「ヨガ好き」「リピーター」等の自動タグ付け
- **スコアリング**: 顧客ロイヤリティの自動計算

## 🚀 実装済み機能

### 1. メッセージングプロバイダー切り替え
```typescript
// .env.local で設定
MESSAGING_PROVIDER="lstep"  // または "line"
```

### 2. 統合メッセージングサービス
- **予約確認**: リッチなFlexメッセージで送信
- **リマインダー**: 指定時間前の自動通知
- **キャンセル確認**: キャンセル完了通知

### 3. 自動フォールバック
- Lステップ接続エラー時は公式LINEで送信
- 開発環境では両方ともモックモードで動作

## 📋 セットアップ手順

### 1. Lステップアカウント設定
1. [Lステップ](https://lstep.app)でアカウント作成
2. API設定でAPIキーを取得
3. LINE公式アカウントと連携

### 2. 環境変数設定
`.env.local`に以下を追加：
```env
# Lステップ設定
LSTEP_API_KEY="your-lstep-api-key"
LSTEP_API_URL="https://api.lstep.app/v1"
MESSAGING_PROVIDER="lstep"

# 公式LINE設定（フォールバック用）
LINE_CHANNEL_ACCESS_TOKEN="your-line-token"
LINE_CHANNEL_SECRET="your-line-secret"
```

### 3. テスト実行
```bash
# ヘルスチェック
curl http://localhost:3000/api/test-lstep

# 予約確認テスト
curl -X POST http://localhost:3000/api/test-lstep \
  -H "Content-Type: application/json" \
  -d '{
    "lineId": "your-line-id",
    "provider": "lstep",
    "testType": "booking"
  }'
```

## 💼 実際の使用例

### 予約確認メッセージ (Lステップ経由)
```typescript
import { messagingService } from '@/lib/messaging-service'

// 予約完了時
await messagingService.sendBookingConfirmation({
  customerName: '田中 太郎',
  lineId: 'U1234567890abcdef',
  date: '2025-06-30',
  time: '10:00-11:00',
  program: 'ヨガベーシック',
  instructor: '山田 美香',
  studio: 'スタジオA',
  reservationId: 12345,
  programColor: '#4CAF50'
})
```

### リマインダー送信
```typescript
// レッスン2時間前
await messagingService.sendReminder({
  customerName: '田中 太郎',
  lineId: 'U1234567890abcdef',
  date: '2025-06-30',
  time: '10:00-11:00',
  program: 'ヨガベーシック',
  studio: 'スタジオA',
  hoursUntil: 2
})
```

## 🔧 カスタマイズポイント

### 1. メッセージテンプレート
`lib/lstep-client.ts`でメッセージ内容をカスタマイズ：
- 予約確認メッセージ
- リマインダーメッセージ
- キャンセル確認メッセージ

### 2. Flexメッセージデザイン
`sendRichBookingConfirmation`でリッチメッセージのデザインを調整：
- カラーテーマ
- レイアウト
- ボタン配置

### 3. 配信タイミング
- 即時配信 (immediate)
- 指定時刻配信 (scheduled)
- 最適化配信 (optimized)

## 🔍 モニタリング

### 1. 配信状況確認
```typescript
const health = await messagingService.healthCheck()
console.log(health) // { line: true, lstep: true, currentProvider: 'lstep' }
```

### 2. 通知ログ
データベースの`notification_logs`テーブルで以下を記録：
- 送信成功/失敗
- 使用プロバイダー
- レスポンス詳細
- エラーメッセージ

### 3. エラーハンドリング
- Lステップ接続エラー → 公式LINEでフォールバック
- API制限エラー → リトライ機能
- 無効なLINE ID → エラーログ記録

## 📈 今後の拡張

### 1. 高度なシナリオ配信
- 予約 → 確認 → リマインダー → アフターフォロー
- 未来店者への再来店促進
- 会員ランクアップ通知

### 2. パーソナライゼーション
- 過去の予約履歴に基づくおすすめプログラム
- 個人の好みに合わせたメッセージ内容
- 生体リズムに合わせた配信時間最適化

### 3. アナリティクス連携
- Google Analytics との連携
- 配信効果の可視化
- ROI測定

## 🎯 切り替え方法

### 開発・テスト時
```env
MESSAGING_PROVIDER="line"  # 公式LINE直送信
```

### 本番運用時
```env
MESSAGING_PROVIDER="lstep"  # Lステップ経由
```

動的切り替えも可能：
```typescript
// 緊急時は公式LINE直送信
await messagingService.sendBookingConfirmation(data, 'line')

// 通常時はLステップ経由
await messagingService.sendBookingConfirmation(data, 'lstep')
```