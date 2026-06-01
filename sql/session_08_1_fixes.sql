-- Session 08.1: Enrollment insert policy for students
-- Students need to be able to insert their own enrollment
-- after a successful payment (or free enrollment for now).

drop policy if exists "Users can insert own enrollment" on public.enrollments;
create policy "Users can insert own enrollment"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

-- Verify the policy exists
select policyname, cmd from pg_policies
where tablename = 'enrollments';
