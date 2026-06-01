-- Session 08: Minor schema fixes

-- Ensure profiles are readable by service role (backend)
-- No change needed — service role bypasses RLS already.

-- Fix: course_progress_view may error if no lessons exist yet.
-- Drop and recreate with a safe coalesce guard.
drop view if exists public.course_progress_view cascade;
create or replace view public.course_progress_view as
select
  e.user_id,
  e.course_id,
  c.title as course_title,
  coalesce(c.total_lessons, 0) as total_lessons,
  count(lp.id) filter (where lp.completed = true) as completed_lessons,
  case
    when coalesce(c.total_lessons, 0) = 0 then 0
    else round(
      (count(lp.id) filter (where lp.completed = true))::numeric
      / c.total_lessons * 100
    )
  end as progress_pct
from public.enrollments e
join public.courses c on c.id = e.course_id
left join public.lesson_progress lp
  on lp.course_id = e.course_id
  and lp.user_id = e.user_id
group by e.user_id, e.course_id, c.title, c.total_lessons;

-- Fix: lessons RLS policy references enrollments but
-- enrollments may not exist yet for new users.
-- Drop and recreate with a safer policy.
drop policy if exists "Enrolled users can view all lessons" on public.lessons;
create policy "Enrolled users can view all lessons"
  on public.lessons for select using (
    is_preview = true
    or exists (
      select 1 from public.enrollments en
      join public.modules mo on mo.id = module_id
      where en.user_id = auth.uid()
        and en.course_id = mo.course_id
    )
  );

-- Fix: admin_student_progress view — wrap subquery
-- to avoid ambiguous column reference on older Postgres.
drop view if exists public.admin_student_progress cascade;
create or replace view public.admin_student_progress as
select
  p.id as user_id,
  p.full_name,
  e.id as enrollment_id,
  e.course_id,
  c.title as course_title,
  c.category,
  e.enrolled_at,
  coalesce(prog.completed_lessons, 0) as completed_lessons,
  coalesce(c.total_lessons, 0) as total_lessons,
  case
    when coalesce(c.total_lessons, 0) = 0 then 0
    else round(
      coalesce(prog.completed_lessons, 0)::numeric
      / c.total_lessons * 100
    )
  end as progress_pct,
  cert.certificate_id,
  cert.issued_at as cert_issued_at
from public.enrollments e
join public.profiles p on p.id = e.user_id
join public.courses c on c.id = e.course_id
left join (
  select user_id, course_id, count(*) as completed_lessons
  from public.lesson_progress
  where completed = true
  group by user_id, course_id
) prog on prog.user_id = e.user_id
      and prog.course_id = e.course_id
left join public.certificates cert
  on cert.user_id = e.user_id
  and cert.course_id = e.course_id;
