# フィットネス予約システム - 認証機能ガイド

## 概要

本システムでは、Supabase Authを使用した安全で包括的な認証システムを実装しています。管理者アカウントの作成からログイン、アクセス制御まで、すべての認証機能が統合されています。

## 🚀 認証システムの特徴

- **Supabase Auth**: 業界標準のJWT認証
- **メール認証**: メール確認機能付きユーザー登録
- **アクセス制御**: ミドルウェアベースの保護
- **リアルタイム**: 認証状態のリアルタイム同期
- **レスポンシブ**: モバイル対応の認証UI

## 📋 初期セットアップ

### 1. 環境変数の設定

`.env.local`ファイルに以下の設定が必要です：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 初期管理者アカウントの作成

初回セットアップ時は、以下のURLにアクセスして管理者アカウントを作成します：

```
http://localhost:3000/setup
```

**手順：**
1. 管理者名を入力
2. メールアドレスを入力
3. パスワードを設定（6文字以上）
4. パスワード確認
5. 「管理者アカウント作成」ボタンをクリック

## 🔐 認証フロー

### ログイン

```
http://localhost:3000/auth/signin
```

**機能：**
- メールアドレス・パスワードによるログイン
- 新規登録機能（同一画面で切り替え可能）
- パスワード表示/非表示切り替え
- エラーハンドリング
- テスト用アカウント表示

### ログアウト

管理画面のヘッダーから「サインアウト」ボタンでログアウトできます。

## 🛡️ アクセス制御

### 保護されたページ

以下のページは認証が必要です：

- `/dashboard` - メインダッシュボード
- `/dashboard/*` - 全ての管理画面

### 未認証時の動作

- 保護されたページにアクセス → 自動的にログインページにリダイレクト
- ログイン後 → 元のページにリダイレクト

## 📱 コンポーネント構成

### AuthGuard

保護されたページをラップするコンポーネント：

```tsx
<AuthGuard requireAuth={true}>
  <YourProtectedComponent />
</AuthGuard>
```

### UserProvider

アプリ全体でユーザー状態を管理：

```tsx
import { useUser } from '@/components/auth/user-provider'

function Component() {
  const { user, loading, signOut } = useUser()
  // ...
}
```

## 🔧 API エンドポイント

### 認証関連API

| エンドポイント | メソッド | 説明 |
|---------------|----------|------|
| `/api/auth/setup` | POST | 初期管理者作成 |
| `/api/auth/user` | GET | 現在のユーザー情報取得 |
| `/auth/signin` | - | ログインページ |
| `/auth/signout` | POST | ログアウト処理 |
| `/auth/callback` | GET | 認証コールバック |
| `/auth/confirm` | GET | メール確認処理 |

### 使用例

```typescript
// ユーザー情報取得
const response = await fetch('/api/auth/user')
const { user } = await response.json()

// 初期管理者作成
const response = await fetch('/api/auth/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '管理者名',
    email: 'admin@example.com',
    password: 'password123'
  })
})
```

## 🔒 セキュリティ機能

### ミドルウェア保護

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

### Row Level Security (RLS)

Supabaseでデータベースレベルのセキュリティを実装：

- ユーザーごとのデータアクセス制御
- 管理者権限の適切な管理
- 不正アクセスの防止

## 🐛 トラブルシューティング

### よくある問題

1. **環境変数が設定されていない**
   ```
   Error: Missing Supabase environment variables
   ```
   → `.env.local`ファイルの設定を確認

2. **認証トークンの期限切れ**
   - 自動的にログインページにリダイレクト
   - 再ログインが必要

3. **メール確認が完了していない**
   - メールボックスを確認
   - 確認リンクをクリック

### ログの確認

開発環境では、ブラウザのコンソールで認証関連のログを確認できます：

```javascript
// Supabaseクライアントの認証状態確認
supabase.auth.getUser().then(console.log)
```

## 📈 今後の拡張予定

- [ ] ソーシャルログイン（Google、LINE）
- [ ] 二要素認証（2FA）
- [ ] パスワードリセット機能
- [ ] ユーザー権限の詳細管理
- [ ] セッション管理の最適化

## 📞 サポート

認証に関する問題や質問がある場合は、以下の情報と共にお問い合わせください：

- エラーメッセージ
- 実行した操作
- ブラウザのコンソールログ
- 環境変数の設定状況（機密情報は除く）

---

**注意**: 本番環境では、環境変数やシークレットキーの管理に十分注意してください。 