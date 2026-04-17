-- Run this in Supabase SQL Editor for existing projects.
-- Aligns tasks.assigned_to with free-text assignee names and keeps task RLS compatible.

-- 1) Convert tasks.assigned_to from UUID FK to TEXT (free-text assignee)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'assigned_to'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
    ALTER TABLE public.tasks
      ALTER COLUMN assigned_to TYPE text
      USING assigned_to::text;
  END IF;
END $$;

-- 2) Rebuild index for text-based assignee filtering
DROP INDEX IF EXISTS idx_tasks_assigned_to;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- 3) Refresh tasks update policy to remove UUID-based assigned_to check
DROP POLICY IF EXISTS "Assigned users and project managers can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task updates by creator/assigner/admin" ON public.tasks;
CREATE POLICY "Task updates by creator/assigner/admin" ON public.tasks
FOR UPDATE USING (
  assigned_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4) Keep insert policy compatible when project_id is null
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
  project_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND (
        p.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
      )
  )
);
