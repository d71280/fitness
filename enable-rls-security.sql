-- Enable Row Level Security for all sensitive tables
-- This will make reservation and customer data private

-- Enable RLS for all tables containing sensitive data
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create security policies for customers table
-- Only allow customers to access their own data
CREATE POLICY "customers_select_own" ON customers FOR SELECT
  USING (line_id = auth.uid());

CREATE POLICY "customers_insert_own" ON customers FOR INSERT
  WITH CHECK (line_id = auth.uid());

CREATE POLICY "customers_update_own" ON customers FOR UPDATE
  USING (line_id = auth.uid());

-- Admin access to all customers
CREATE POLICY "customers_admin_all" ON customers FOR ALL
  USING (auth.role() = 'admin');

-- Create security policies for reservations table
-- Only allow customers to access their own reservations
CREATE POLICY "reservations_select_own" ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = reservations.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

CREATE POLICY "reservations_insert_own" ON reservations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = reservations.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

CREATE POLICY "reservations_update_own" ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = reservations.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

-- Admin access to all reservations
CREATE POLICY "reservations_admin_all" ON reservations FOR ALL
  USING (auth.role() = 'admin');

-- Create security policies for waiting_list table
CREATE POLICY "waiting_list_select_own" ON waiting_list FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = waiting_list.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

CREATE POLICY "waiting_list_insert_own" ON waiting_list FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = waiting_list.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

CREATE POLICY "waiting_list_update_own" ON waiting_list FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = waiting_list.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

-- Admin access to all waiting list
CREATE POLICY "waiting_list_admin_all" ON waiting_list FOR ALL
  USING (auth.role() = 'admin');

-- Create security policies for notification_logs table
CREATE POLICY "notification_logs_select_own" ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = notification_logs.customer_id 
      AND customers.line_id = auth.uid()
    )
  );

-- Admin access to all notification logs
CREATE POLICY "notification_logs_admin_all" ON notification_logs FOR ALL
  USING (auth.role() = 'admin');

-- Create security policies for admins table
-- Only allow admins to access admin data
CREATE POLICY "admins_select_own" ON admins FOR SELECT
  USING (auth.role() = 'admin');

CREATE POLICY "admins_all_admin" ON admins FOR ALL
  USING (auth.role() = 'admin');

-- Create security policies for app_settings table
-- Only allow admins to access settings
CREATE POLICY "app_settings_admin_all" ON app_settings FOR ALL
  USING (auth.role() = 'admin');

-- Public tables (schedules, programs, instructors, studios) remain public
-- These don't contain sensitive customer data

-- Grant service role access to bypass RLS for backend operations
-- This allows your API to function properly while maintaining security
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;