-- 管理者アカウント追加の修正版
-- パスワードフィールドが必須のため、ダミーパスワードを設定

-- あなたのアカウントを管理者として追加
INSERT INTO admins (email, password, name, role, created_at, updated_at) 
VALUES (
    'daiki-akiyama@muchinochikaigi.com',  -- あなたのメールアドレス
    'dummy_password_not_used',             -- ダミーパスワード（実際は使用されない）
    'システム管理者',                        -- 表示名
    'admin',                               -- 権限レベル
    NOW(),
    NOW()
);

-- 確認用：管理者が正しく追加されたかチェック
SELECT email, name, role, created_at FROM admins WHERE email = 'daiki-akiyama@muchinochikaigi.com';