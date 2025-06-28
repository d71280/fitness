# フィットネススタジオ予約システム

Next.js 14 App Router、Prisma、PostgreSQL、Lステップ連携を使ったフルスタック予約管理システム

## 🎯 プロジェクト概要

フィットネススタジオの週間スケジュール管理・予約システム。顧客がカレンダーで予約すると自動でLINEメッセージが送信される仕組みを構築。

## ✨ 実装済み機能

### ✅ Phase 1: 基本機能
- ✅ Next.js 14 App Router プロジェクトセットアップ
- ✅ Prisma スキーマ設計とデータベース設定
- ✅ 基本的なプロジェクト構造構築
- ✅ 週間カレンダー表示コンポーネント
- ✅ スケジュール管理API（基本CRUD）

### ✅ Phase 2: 繰り返しスケジュール・予約機能
- ✅ 繰り返しスケジュール機能（毎日・毎週・毎月・毎年対応）
- ✅ スケジュール追加モーダル（プレビュー機能付き）
- ✅ 基本予約機能（空き状況チェック、重複防止）
- ✅ 予約モーダル（顧客情報入力、満席表示）
- ✅ 予約API（作成・バリデーション）

### ✅ Phase 3: LINE連携・管理機能
- ✅ Lステップクライアント実装（Flex Message対応）
- ✅ LINE通知機能（予約確認・リマインダー・空き通知）
- ✅ NextAuth.js認証システム（デモアカウント対応）
- ✅ 管理ダッシュボード（統計表示・運営ヒント）
- ✅ Vercel Cron Jobs設定（毎日19:00リマインダー配信）

### 📅 週間カレンダー機能
- 月曜日始まりの週間ビュー
- 日付ナビゲーション（前週・次週・今日）
- 今日の日付ハイライト
- 土日の背景色変更
- スケジュールブロック表示
  - 時間表記
  - プログラム名（太字）
  - インストラクター名
  - 空き状況表示
  - プログラム別カラーコーディング

### 🔧 技術スタック
- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **バックエンド**: Next.js App Router API Routes
- **データベース**: PostgreSQL + Prisma ORM
- **UI**: Lucide React Icons, Radix UI components

## 🚀 セットアップ・起動方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.local` を編集して必要な環境変数を設定

### 3. データベースセットアップ（オプション）
```bash
# PostgreSQLが利用可能な場合
npm run db:migrate
npm run db:seed
```

### 4. 開発サーバー起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

## 📱 画面遷移

- `/` - ホームページ（システム概要）
- `/schedule` - 週間スケジュール表示（実装済み）
- `/dashboard` - 管理画面（準備中）
- `/booking/[id]` - 予約ページ（準備中）

### 🔄 繰り返しスケジュール機能
- 繰り返しパターン選択（なし・毎日・毎週・毎月・毎年）
- 終了条件設定（終了日 or 回数制限）
- リアルタイムプレビュー
- 一括スケジュール生成

### 📝 予約機能
- スケジュールクリックで予約モーダル表示
- 顧客情報入力（名前・LINE ID・電話番号）
- 空き状況リアルタイム表示
- 満席時の適切な案内
- 重複予約防止

## 🛠️ 次の実装予定 (Phase 3)

- Lステップ API連携（LINE通知）
- 自動通知機能（予約確認・リマインダー）
- キャンセル待ち機能
- 顧客管理機能
- 管理ダッシュボード

## 📚 API エンドポイント

### 実装済み
- `GET /api/schedules/weekly?start=YYYY-MM-DD` - 週間スケジュール取得
- `GET /api/programs` - プログラム一覧
- `GET /api/instructors` - インストラクター一覧  
- `GET /api/studios` - スタジオ一覧
- `POST /api/schedules` - 単発スケジュール作成
- `POST /api/schedules/recurring` - 繰り返しスケジュール作成
- `GET /api/reservations` - 予約一覧取得
- `POST /api/reservations` - 新規予約作成

## 💡 開発メモ

- データベース接続ができない環境では自動的にモックデータを使用
- コンポーネントは再利用性を重視した設計
- TypeScriptで型安全性を確保
- Tailwind CSSでレスポンシブデザイン対応

## 🎨 デザインシステム

- プライマリカラー: Blue (Tailwindのprimary)
- プログラム別カラー:
  - ヨガ: Green (bg-green-500)
  - ピラティス: Purple (bg-purple-500)
  - ズンバ: Red (bg-red-500)
  - HIIT: Orange (bg-orange-500)

---

**開発状況**: Phase 2 完了 - 繰り返しスケジュール機能と基本予約機能実装済み

### 🎉 Phase 2で追加された主要機能
1. **繰り返しスケジュール作成** - 週次レッスンなどの定期開催に対応
2. **プレビュー機能付きスケジュール追加モーダル** - 直感的なUI/UX
3. **完全な予約システム** - 空き状況管理・重複防止・満席表示
4. **モックデータ対応** - データベースなしでも全機能が動作

次のPhase 3では、Lステップ連携によるLINE自動通知機能を実装予定です。

## 🔧 環境変数設定

### 開発環境での設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# LINE Bot設定（必須）
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# LIFF設定（必須）  
NEXT_PUBLIC_LIFF_ID=your_liff_id_here

# アプリベースURL（開発時は自動設定されるポート番号に合わせる）
APP_BASE_URL=http://localhost:3005

# Next.js設定
NODE_ENV=development
NEXTAUTH_SECRET=development-secret-key

# LINE デバッグモード（開発時はtrue推奨）
LINE_DEBUG_MODE=true

# その他（オプション）
CRON_SECRET=development-cron-secret
```

### 本番環境（Vercel）での設定

Vercelダッシュボードの環境変数設定で以下を設定：

- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Developers Consoleから取得
- `NEXT_PUBLIC_LIFF_ID`: LIFF アプリのIDを設定
- `APP_BASE_URL`: `https://your-app.vercel.app`

### LINE Developers Console設定

1. **Messaging APIチャネル**でチャネルアクセストークンを取得
2. **LIFF**アプリを作成してLIFF IDを取得
3. **Webhook URL**を設定: `https://your-app.vercel.app/api/webhook/lstep`

### APP_BASE_URLについて

`APP_BASE_URL`は、LINEから送られるボタンURLやWebhookテスト時に使用するアプリケーションのベースURLです：

- **開発環境**: `http://localhost:3005` (現在のポート番号に合わせる)
- **本番環境**: `https://your-app.vercel.app`

### テスト用エンドポイント

設定確認用のテストエンドポイント：

- LINE通知テスト: `http://localhost:3005/api/test-line-notification`
- Webhook接続テスト: `http://localhost:3005/api/test-webhook`
- 管理画面: `http://localhost:3005/dashboard/settings`