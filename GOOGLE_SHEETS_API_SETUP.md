# 📊 Google Sheets連携の実装詳細と設定方法

## 🏗️ アーキテクチャ概要

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Next.js    │────▶│  Google     │────▶│    GAS      │
│  アプリ     │     │  Sheets     │     │  スクリプト  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│ サービス    │                          │ グループ    │
│ アカウント  │                          │   LINE      │
└─────────────┘                          └─────────────┘
```

## 📋 実装内容

### 1. **Google Sheets連携ライブラリ（`lib/google-sheets.ts`）**

```typescript
// 主要な実装内容
- JWT認証を使用したサービスアカウント認証
- google-spreadsheetライブラリを使用
- 予約データの追加・取得・更新機能
```

### 2. **環境変数の設定**

```env
# Google Sheets API関連
GOOGLE_SERVICE_ACCOUNT_EMAIL="サービスアカウントのメールアドレス"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n秘密鍵\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID="スプレッドシートのID"

# オプション設定
GOOGLE_SHEETS_ENABLED="true"  # 連携を有効化
```

## 🔧 外部設定手順（詳細版）

### ステップ1: Google Cloud Platform設定

#### 1. プロジェクト作成
```bash
1. https://console.cloud.google.com にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名: fitness-booking-system
4. 組織: なし（個人の場合）
5. 「作成」をクリック
```

#### 2. API有効化
```bash
# 左メニュー → APIとサービス → ライブラリ
1. 「Google Sheets API」を検索 → 有効化
2. 「Google Drive API」を検索 → 有効化
```

#### 3. サービスアカウント作成
```bash
# IAMと管理 → サービスアカウント
1. 「サービスアカウントを作成」
2. サービスアカウント名: fitness-sheets-service
3. サービスアカウントID: 自動生成
4. 「作成して続行」

# 権限設定
5. ロール: 「編集者」を選択
6. 「続行」→「完了」

# 鍵の作成
7. 作成したサービスアカウントをクリック
8. 「鍵」タブ → 「鍵を追加」→「新しい鍵を作成」
9. 「JSON」を選択 → 「作成」
10. JSONファイルがダウンロードされる
```

### ステップ2: Google Sheets設定

#### 1. スプレッドシート作成
```
1. https://sheets.google.com にアクセス
2. 「空白」をクリックして新規作成
3. 名前を「フィットネス予約管理」に変更
```

#### 2. 権限設定（重要）
```
1. 右上の「共有」ボタンをクリック
2. JSONファイルから "client_email" の値をコピー
   例: fitness-sheets-service@project-id.iam.gserviceaccount.com
3. このメールアドレスを「ユーザーやグループと共有」に貼り付け
4. 権限を「編集者」に設定
5. 「共有」をクリック
```

#### 3. スプレッドシートID取得
```
URL例: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                            ↑ この部分がスプレッドシートID
```

### ステップ3: 環境変数設定

#### 1. JSONファイルから必要な値を抽出
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "fitness-sheets-service@your-project.iam.gserviceaccount.com",
  ...
}
```

#### 2. `.env.local`に設定
```env
# client_emailの値
GOOGLE_SERVICE_ACCOUNT_EMAIL="fitness-sheets-service@your-project.iam.gserviceaccount.com"

# private_keyの値（改行に注意）
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# スプレッドシートID
GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

### ステップ4: GAS（Google Apps Script）設定

#### 1. スクリプト追加
```javascript
1. スプレッドシートを開く
2. 拡張機能 → Apps Script
3. gas-scripts/google-apps-script.js の内容をコピー
4. 貼り付けて保存
```

#### 2. 設定値更新
```javascript
const CONFIG = {
  LINE_GROUP_TOKEN: 'YOUR_LINE_TOKEN',      // LINE Developersから取得
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',    // スプレッドシートID
  WEBHOOK_URL: 'YOUR_APP_URL/api/webhook',  // あなたのアプリURL
  SHEET_NAME: '予約管理'
}
```

#### 3. トリガー設定
```
1. 時計アイコン（トリガー）をクリック
2. 「トリガーを追加」
3. 実行する関数: onEdit
4. イベントの種類: スプレッドシートから
5. イベントタイプ: 編集時
6. 保存
```

## 🔑 APIキーの取得場所まとめ

### Google Cloud関連
| 項目 | 取得場所 | 用途 |
|------|---------|------|
| サービスアカウントメール | GCP Console → IAM → サービスアカウント | 認証用 |
| 秘密鍵 | サービスアカウント → 鍵 → JSON作成 | API認証 |
| スプレッドシートID | Google SheetsのURL | データ保存先 |

### LINE関連（グループ通知用）
| 項目 | 取得場所 | 用途 |
|------|---------|------|
| チャンネルアクセストークン | LINE Developers → Messaging API | Bot認証 |
| グループID | LINEアプリ → グループ設定 | 送信先指定 |

## 🧪 動作確認方法

### 1. コンソールでテスト
```bash
# API接続テスト
curl http://localhost:3000/api/test-connection

# スプレッドシート書き込みテスト
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"scheduleId":1,"customerName":"テスト太郎","lineId":"U123"}'
```

### 2. 管理画面でテスト
```
1. /dashboard/settings にアクセス
2. 「スプレッドシート接続テスト」をクリック
3. ✅ 成功 と表示されればOK
```

### 3. スプレッドシート確認
```
1. Google Sheetsを開く
2. 「予約管理」シートが作成されている
3. テストデータが記録されている
```

## ❗ よくあるエラーと対処法

### 1. 認証エラー
```
Error: The caller does not have permission
```
**対処法:**
- サービスアカウントのメールアドレスをスプレッドシートに共有しているか確認
- 権限が「編集者」になっているか確認

### 2. API未有効化エラー
```
Error: Google Sheets API has not been used in project
```
**対処法:**
- GCP ConsoleでGoogle Sheets APIを有効化
- Google Drive APIも有効化されているか確認

### 3. 秘密鍵エラー
```
Error: error:0909006C:PEM routines:get_name:no start line
```
**対処法:**
- GOOGLE_PRIVATE_KEYの改行が正しく設定されているか確認
- `\n`が実際の改行になっているか確認

### 4. スプレッドシートIDエラー
```
Error: Requested entity was not found
```
**対処法:**
- スプレッドシートIDが正しいか確認
- URLから正確にコピーされているか確認

## 📊 実装されている機能

### 1. 予約記録
```typescript
// 予約完了時に自動実行
await sheetsClient.addBookingRecord({
  予約ID: booking.id,
  顧客名: customer.name,
  プログラム: program.name,
  // ... その他のデータ
})
```

### 2. データ取得
```typescript
// 今日の予約一覧を取得
const todayBookings = await sheetsClient.getTodayBookings()
```

### 3. 統計情報取得
```typescript
// 予約統計を取得
const stats = await sheetsClient.getBookingStats()
```

## 🚀 拡張可能な機能

1. **自動レポート生成**
   - 日次・週次・月次レポート
   - グラフ生成

2. **データ分析**
   - 人気プログラムランキング
   - 時間帯別稼働率

3. **多店舗対応**
   - シート別管理
   - 店舗間比較

4. **顧客管理**
   - 顧客履歴追跡
   - リピート率分析

これで完全なGoogle Sheets連携が実装できます！