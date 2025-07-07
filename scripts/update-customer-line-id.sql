-- テスト用にLINE IDを設定するSQL
-- 実際のLINE IDに置き換えてください

UPDATE customers 
SET line_id = 'U1234567890abcdef1234567890abcdef' 
WHERE id = (
    SELECT customer_id 
    FROM reservations 
    WHERE status = 'confirmed' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 確認用クエリ
SELECT c.id, c.name, c.line_id, r.created_at
FROM customers c
JOIN reservations r ON c.id = r.customer_id
WHERE r.status = 'confirmed'
ORDER BY r.created_at DESC
LIMIT 5;