-- Row Level Security (RLS) ポリシーの設定

-- RLSを有効化
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- プログラム：誰でも読み取り可能、管理者のみ変更可能
CREATE POLICY "Programs are viewable by everyone" ON programs
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert programs" ON programs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update programs" ON programs
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete programs" ON programs
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- インストラクター：誰でも読み取り可能、管理者のみ変更可能
CREATE POLICY "Instructors are viewable by everyone" ON instructors
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage instructors" ON instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- スタジオ：誰でも読み取り可能、管理者のみ変更可能
CREATE POLICY "Studios are viewable by everyone" ON studios
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage studios" ON studios
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- スケジュール：誰でも読み取り可能、管理者のみ変更可能
CREATE POLICY "Schedules are viewable by everyone" ON schedules
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage schedules" ON schedules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 顧客：本人と管理者のみアクセス可能
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (
        auth.uid()::text = line_id OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (auth.uid()::text = line_id)
    WITH CHECK (auth.uid()::text = line_id);

CREATE POLICY "Only admins can insert customers" ON customers
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete customers" ON customers
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 予約：本人と管理者のみアクセス可能
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        ) OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can create own reservations" ON reservations
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own reservations" ON reservations
    FOR UPDATE USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        )
    );

CREATE POLICY "Only admins can delete reservations" ON reservations
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- キャンセル待ち：本人と管理者のみアクセス可能
CREATE POLICY "Users can view own waiting list" ON waiting_list
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        ) OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can join waiting list" ON waiting_list
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        )
    );

CREATE POLICY "Only admins can manage waiting list" ON waiting_list
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete from waiting list" ON waiting_list
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 通知ログ：本人と管理者のみ閲覧可能
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE line_id = auth.uid()::text
        ) OR 
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Only system can create notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 管理者：管理者のみアクセス可能
CREATE POLICY "Only admins can access admin table" ON admins
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- サービスロール用のポリシー（バックエンドAPIから使用）
CREATE POLICY "Service role has full access" ON programs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON studios
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON schedules
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON customers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON reservations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON waiting_list
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access" ON notification_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');