-- Add your account to the admins table
-- Replace 'your-email@example.com' with your actual email address

-- First, check what email you're currently signed in with
-- You can find this in Supabase Dashboard -> Authentication -> Users

-- Example: Add admin account
-- Replace the email below with your actual email from Supabase Auth
INSERT INTO admins (email, name, role, created_at, updated_at) 
VALUES (
    'your-email@example.com',  -- Replace with your actual email
    'System Administrator',     -- Your display name
    'admin',                   -- Role (admin or staff)
    NOW(),
    NOW()
);

-- If you want to add multiple accounts, use this format:
-- INSERT INTO admins (email, name, role, created_at, updated_at) VALUES
-- ('admin1@example.com', 'Admin 1', 'admin', NOW(), NOW()),
-- ('staff1@example.com', 'Staff 1', 'staff', NOW(), NOW()),
-- ('admin2@example.com', 'Admin 2', 'admin', NOW(), NOW());

-- To check if the admin was added successfully:
SELECT * FROM admins WHERE email = 'your-email@example.com';

-- To see all admins:
SELECT email, name, role, created_at FROM admins ORDER BY created_at;