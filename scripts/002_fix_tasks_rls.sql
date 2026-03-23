-- Migration: Remove all role-based RLS restrictions
-- All authenticated users now have full access to all tables.
-- Only admins (via Supabase service role) can bypass RLS if needed.

-- ============================================================
-- TASKS
-- ============================================================
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Assigned users and project managers can update tasks" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- PROJECTS
-- ============================================================
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only admins can delete projects" ON public.projects;

CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- EXPENSES
-- ============================================================
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Users can submit their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- PAYMENTS
-- ============================================================
DROP POLICY IF EXISTS "Payments are viewable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments can be created by managers and admins" ON public.payments;
DROP POLICY IF EXISTS "Payments can be updated by managers and admins" ON public.payments;

CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- SALARIES
-- ============================================================
DROP POLICY IF EXISTS "Admins and managers can view salaries" ON public.salaries;
DROP POLICY IF EXISTS "Only admins can manage salaries" ON public.salaries;
DROP POLICY IF EXISTS "Only admins can update salaries" ON public.salaries;

CREATE POLICY "salaries_select" ON public.salaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "salaries_insert" ON public.salaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "salaries_update" ON public.salaries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "salaries_delete" ON public.salaries FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- LEADS
-- ============================================================
DROP POLICY IF EXISTS "Leads are viewable by sales team" ON public.leads;
DROP POLICY IF EXISTS "Managers and admins can create leads" ON public.leads;
DROP POLICY IF EXISTS "Managers and admins can update leads" ON public.leads;

CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "leads_update" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "leads_delete" ON public.leads FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- CAMPAIGNS
-- ============================================================
DROP POLICY IF EXISTS "Campaigns are viewable by authenticated users" ON public.campaigns;
DROP POLICY IF EXISTS "Managers and admins can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Campaign creators can update campaigns" ON public.campaigns;

CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- TASK COMMENTS
-- ============================================================
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.task_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.task_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.task_comments;

CREATE POLICY "task_comments_select" ON public.task_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "task_comments_insert" ON public.task_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "task_comments_update" ON public.task_comments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "task_comments_delete" ON public.task_comments FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
DROP POLICY IF EXISTS "Activity logs are viewable by authenticated users" ON public.activity_logs;
DROP POLICY IF EXISTS "Activity logs can be created by authenticated users" ON public.activity_logs;

CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "activity_logs_update" ON public.activity_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "activity_logs_delete" ON public.activity_logs FOR DELETE USING (auth.role() = 'authenticated');
