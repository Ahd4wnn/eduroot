-- Session 08.2: Certificates insert policy for students
-- Allow students to insert/generate their own certificate records after 100% completion.

drop policy if exists "Users can insert own certificates" on public.certificates;
create policy "Users can insert own certificates"
  on public.certificates for insert
  with check (auth.uid() = user_id);

-- Verify the policies exist on certificates table
select policyname, cmd from pg_policies
where tablename = 'certificates';
