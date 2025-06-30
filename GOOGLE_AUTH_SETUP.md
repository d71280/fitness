# Google認証設定ガイド

## 1. Google Cloud Console設定

### Google Cloud Consoleでプロジェクト設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成するか既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動

### OAuth 2.0 クライアント ID 作成
1. 「認証情報を作成」→「OAuth クライアント ID」をクリック
2. アプリケーションの種類：「ウェブアプリケーション」を選択
3. 名前：`Fitness Booking System` など任意の名前
4. 承認済みのリダイレクト URI に以下を追加：
   - 開発環境: `http://localhost:3000/auth/callback`
   - 本番環境: `https://your-domain.vercel.app/auth/callback`

### OAuth同意画面の設定
1. 「OAuth同意画面」タブをクリック
2. ユーザータイプ：「外部」を選択（テスト用）
3. アプリ情報を入力：
   - アプリ名：`Fitness Booking System`
   - ユーザーサポートメール：管理者メールアドレス
   - デベロッパー連絡先情報：管理者メールアドレス

## 2. Supabase設定

### Supabase ダッシュボード設定
1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 「Authentication」→「Providers」に移動
4. 「Google」プロバイダーを有効化
5. Google Cloud Consoleで取得した以下を設定：
   - Client ID: `GOOGLE_CLIENT_ID`
   - Client Secret: `GOOGLE_CLIENT_SECRET`

### リダイレクトURL設定
Supabaseの「Authentication」→「URL Configuration」で以下を設定：
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: 
  - `https://your-domain.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (開発用)

## 3. 環境変数設定

### .env.local ファイル
```env
# Supabase 設定（既存）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth は Supabase 側で設定するため、
# 追加の環境変数は不要
```

### Vercel 環境変数設定
1. Vercel ダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 上記の環境変数を全て設定

## 4. 動作確認

### ローカル開発環境
1. `npm run dev` でサーバー起動
2. `http://localhost:3000/auth/signin` にアクセス
3. 「Googleでログイン」ボタンをクリック
4. Google認証後、ダッシュボードにリダイレクトされることを確認

### 本番環境
1. Vercelにデプロイ
2. 本番URLでGoogle認証をテスト
3. 正常にログインできることを確認

## トラブルシューティング

### よくあるエラー
1. **redirect_uri_mismatch**: Google Cloud ConsoleのリダイレクトURIを確認
2. **invalid_client**: Client IDまたはClient Secretが間違っている
3. **access_denied**: OAuth同意画面の設定を確認

### ログの確認
- ブラウザの開発者ツールでネットワークタブを確認
- Supabaseのログを確認
- Vercelのログを確認

## セキュリティ注意事項

1. Client Secretは絶対に公開しない
2. 本番環境では必ずHTTPSを使用
3. OAuth同意画面は「公開」にする前に十分テスト
4. 不要なスコープは要求しない 