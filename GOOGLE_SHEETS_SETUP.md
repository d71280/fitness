# 📊 Google Sheets & グループLINE通知 設定ガイド

## 🎯 概要

予約が完了すると以下の流れで事業者に通知が届きます：

```
予約完了 → スプレッドシートに記録 → Google Apps Script → グループLINEに通知
```

## 📋 必要なもの

- Googleアカウント
- Google スプレッドシート
- LINE グループ & Bot
- Google Cloud Platform プロジェクト

## 🔧 設定手順

### 1. Google Cloud Platform の設定

#### 1.1 プロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名: `fitness-booking-system`

#### 1.2 Google Sheets API を有効化
```bash
# Google Cloud Console で以下のAPIを有効化
- Google Sheets API
- Google Drive API
```

#### 1.3 サービスアカウント作成
1. **IAM と管理** → **サービス アカウント**
2. **サービス アカウントを作成**
3. 名前: `fitness-sheets-service`
4. 役割: `Editor` (編集者)
5. **鍵を作成** → **JSON** → ダウンロード

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "fitness-sheets-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 2. Google スプレッドシート設定

#### 2.1 スプレッドシート作成
1. [Google Sheets](https://sheets.google.com) で新しいスプレッドシートを作成
2. 名前: `フィットネス予約管理`

#### 2.2 権限設定
1. **共有** ボタンをクリック
2. サービスアカウントのメールアドレスを追加
3. 権限: **編集者**

#### 2.3 スプレッドシートID取得
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
ID:  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### 3. LINE グループ & Bot 設定

#### 3.1 LINE Developers でBot作成
1. [LINE Developers](https://developers.line.biz/) にログイン
2. **新規チャンネル作成** → **Messaging API**
3. チャンネル名: `フィットネス事業者通知Bot`

#### 3.2 グループ作成 & Bot追加
1. LINEアプリでグループを作成
2. 作成したBotをグループに追加
3. **グループ設定** → **その他** → **グループID** をメモ

#### 3.3 アクセストークン取得
```bash
# LINE Developers Console
Basic settings → Channel access token → Issue
```

### 4. Google Apps Script 設定

#### 4.1 スクリプト追加
1. スプレッドシートを開く
2. **拡張機能** → **Apps Script**
3. `gas-scripts/google-apps-script.js` の内容をコピー&ペースト

#### 4.2 設定値更新
```javascript
const CONFIG = {
  LINE_GROUP_TOKEN: 'YOUR_LINE_GROUP_ACCESS_TOKEN',
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  SHEET_NAME: '予約管理'
}
```

#### 4.3 トリガー設定
1. **トリガー** → **トリガーを追加**
2. 実行する関数: `onEdit`
3. イベントの種類: `スプレッドシートから`
4. イベントのタイプ: `編集時`

### 5. システム設定

#### 5.1 環境変数設定
```bash
# .env.local に追加
GOOGLE_SERVICE_ACCOUNT_EMAIL="fitness-sheets-service@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
LINE_GROUP_TOKEN="YOUR_LINE_GROUP_ACCESS_TOKEN"
LINE_GROUP_ID="YOUR_LINE_GROUP_ID"
GOOGLE_SHEETS_ENABLED="true"
```

#### 5.2 管理画面で設定
1. `/dashboard/settings` にアクセス
2. **スプレッドシート & グループLINE連携** セクションで設定
3. 各項目を入力
4. **接続テスト** で動作確認
5. **設定を保存**

## 🧪 テスト手順

### 1. スプレッドシート接続テスト
```bash
# 管理画面で実行
📊 スプレッドシート接続テスト → ✅ 成功
```

### 2. グループLINE通知テスト
```bash
# 管理画面で実行
💬 グループLINE通知テスト → ✅ 成功
```

### 3. 予約テスト
1. 実際に予約を作成
2. スプレッドシートに記録されることを確認
3. グループLINEに通知が届くことを確認

## 📊 スプレッドシートのヘッダー構成

自動で以下のヘッダーが作成されます：

| 列 | ヘッダー名 | 説明 |
|---|-----------|------|
| A | 予約ID | システム内の予約ID |
| B | 予約日時 | 予約の日時 |
| C | 顧客名 | お客様の名前 |
| D | 電話番号 | 連絡先 |
| E | プログラム | レッスン名 |
| F | インストラクター | 担当者 |
| G | スタジオ | 場所 |
| H | 開始時間 | レッスン開始時刻 |
| I | 終了時間 | レッスン終了時刻 |
| J | ステータス | 予約状況 |
| K | LINE_ID | 顧客のLINE ID |

## 🎨 通知メッセージのサンプル

### 新規予約通知
```
🆕 新規予約通知

ヨガ

👤 山田 太郎
📅 6月17日(月)
⏰ 10:00 - 11:00
👨‍🏫 田中 美香
🏢 スタジオ1

予約ID: 12345
```

### 今日の予約一覧
```
📅 今日の予約一覧 (3件)

1. 山田 太郎 - ヨガ
   10:00 - 11:00 (スタジオ1)

2. 佐藤 花子 - ピラティス
   14:00 - 15:00 (スタジオ2)

3. 鈴木 次郎 - エアロビクス
   19:00 - 20:00 (スタジオ1)
```

## 🔧 カスタマイズ

### メッセージテンプレート変更
`gas-scripts/google-apps-script.js` の `createBookingNotificationMessage` 関数を編集

### 通知タイミング変更
- `onEdit` 関数で即座に通知
- `sendTodayBookings` 関数を時間トリガーで設定可能

### データ分析
スプレッドシートで以下の分析が可能：
- 日別予約数
- プログラム別人気度
- 時間帯別稼働率
- 顧客リピート率

## ❗ トラブルシューティング

### よくある問題

#### 1. スプレッドシート接続エラー
```
❌ 権限エラー: サービスアカウントにスプレッドシートの編集権限がない
→ スプレッドシートの共有設定を確認
```

#### 2. LINE通知が届かない
```
❌ グループID/アクセストークンが間違っている
→ LINE Developers Console で再確認
```

#### 3. Apps Script エラー
```
❌ 実行権限がない
→ Apps Script でauthorizationを実行
```

### ログ確認方法
```javascript
// Apps Script のログ確認
Logger.log('デバッグ情報')

// 実行時間制限エラーの場合
→ Apps Script の実行時間制限は6分
→ 大量データ処理時は分割実行
```

## 📈 今後の拡張案

1. **ダッシュボード機能**
   - 予約統計の可視化
   - リアルタイム稼働状況

2. **自動レポート**
   - 週次/月次レポートの自動生成
   - メール配信機能

3. **予約分析**
   - 機械学習による需要予測
   - 最適なクラススケジュール提案

4. **多店舗対応**
   - 複数スタジオの統合管理
   - 店舗別通知グループ

---

これで予約データの自動記録とグループLINE通知機能が完成です！🎉 