# 管理者アクセス設定手順

現在「アクセス権限がありません」ページが表示されているのは、セキュリティ機能が正常に動作している証拠です。

## ステップ1: 現在のメールアドレスを確認

1. **Supabaseダッシュボード**にアクセス
2. **Authentication** → **Users**に移動
3. あなたがサインインしているアカウントのメールアドレスをコピー

## ステップ2: 管理者権限を付与

### 方法A: Supabaseダッシュボードで直接実行

1. **Supabaseダッシュボード** → **SQL Editor**
2. 以下のSQLを実行（メールアドレスを自分のものに変更）：

```sql
-- あなたのメールアドレスを管理者として追加
INSERT INTO admins (email, password, name, role, created_at, updated_at) 
VALUES (
    'daiki-akiyama@muchinochikaigi.com',  -- あなたのメールアドレス
    'dummy_password_not_used',             -- ダミーパスワード（実際は使用されない）
    'システム管理者',                        -- 表示名
    'admin',                               -- 権限レベル
    NOW(),
    NOW()
);
```

### 方法B: 複数のアカウントを一度に追加

```sql
INSERT INTO admins (email, name, role, created_at, updated_at) VALUES
('メールアドレス1@example.com', '管理者1', 'admin', NOW(), NOW()),
('メールアドレス2@example.com', 'スタッフ1', 'staff', NOW(), NOW()),
('メールアドレス3@example.com', '管理者2', 'admin', NOW(), NOW());
```

## ステップ3: 確認

1. SQLを実行後、ブラウザで `/dashboard` にアクセス
2. 正常にダッシュボードが表示されればOK

## 権限レベルの説明

- **`admin`**: 全ての管理機能にアクセス可能
- **`staff`**: 一般的な管理機能にアクセス可能
- **`customer`**: 一般ユーザー（管理画面にはアクセス不可）

## トラブルシューティング

### 問題: SQLを実行してもアクセスできない
**解決方法:**
1. メールアドレスが正確に一致しているか確認
2. ブラウザのキャッシュをクリア
3. 一度サインアウトして再度サインイン

### 問題: 「admins」テーブルが存在しない
**解決方法:**
1. `enable-rls-security.sql`を先に実行
2. データベースマイグレーションを確認

### 管理者を確認するSQL
```sql
-- 現在の管理者一覧を表示
SELECT email, name, role, created_at FROM admins ORDER BY created_at;
```

### 管理者を削除するSQL（必要に応じて）
```sql
-- 特定の管理者を削除
DELETE FROM admins WHERE email = '削除したいメールアドレス@example.com';
```

## 完了後の動作

✅ **管理者アカウント**: `/dashboard` にアクセス可能  
✅ **スタッフアカウント**: `/dashboard` にアクセス可能  
❌ **一般ユーザー**: 権限なしページが表示される  
❌ **未認証ユーザー**: サインインページにリダイレクト  

これで安全に管理機能を利用できるようになります！