# Supabase連携セットアップガイド

## 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com)にログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - Name: `fitness-booking-system`
   - Database Password: 強力なパスワードを設定
   - Region: `Northeast Asia (Tokyo)`

## 2. 環境変数設定

`.env.local`ファイルで以下を更新：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**取得方法：**
- Supabaseダッシュボード → Settings → API
- `URL`と`anon public`キーをコピー
- `service_role`キーもコピー（管理用）

## 3. データベーススキーマ作成

Supabase SQL Editor で以下を実行：

```sql
-- supabase/migrations/001_initial_schema.sql の内容をコピー&実行
```

## 4. APIエンドポイント

Supabase連携用の新しいAPIエンドポイント：

- `GET /api/supabase/programs` - プログラム一覧
- `GET /api/supabase/instructors` - インストラクター一覧  
- `GET /api/supabase/studios` - スタジオ一覧
- `GET /api/supabase/schedules` - スケジュール一覧
- `POST /api/supabase/schedules` - スケジュール作成
- `POST /api/supabase/reservations` - 予約作成

## 5. 移行手順

1. Supabaseプロジェクト作成
2. 環境変数設定
3. SQLスキーマ実行
4. アプリケーション再起動
5. `/api/supabase/programs`でテスト

## 6. 利点

- **リアルタイム更新**: 予約状況のリアルタイム同期
- **スケーラビリティ**: 自動スケーリング
- **認証**: Supabase Auth統合可能
- **バックアップ**: 自動バックアップ
- **管理画面**: Supabaseダッシュボードでデータ管理

## 7. 次のステップ

- Row Level Security (RLS) 設定
- リアルタイム subscriptions 実装
- Supabase Auth との統合
- Storage との連携（画像アップロード等）