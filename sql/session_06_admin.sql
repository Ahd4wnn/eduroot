-- Session 06: Admin helpers

-- Admin-safe view of student progress across all courses
create or replace view public.admin_student_progress as
select
  p.id as user_id,
  p.full_name,
  e.course_id,
  c.title as course_title,
  c.category,
  e.enrolled_at,
  coalesce(prog.completed_lessons, 0) as completed_lessons,
  c.total_lessons,
  case
    when c.total_lessons = 0 then 0
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
) prog on prog.user_id = e.user_id and prog.course_id = e.course_id
left join public.certificates cert
  on cert.user_id = e.user_id and cert.course_id = e.course_id;

-- Admin summary stats view
create or replace view public.admin_stats as
select
  (select count(*) from public.profiles where role = 'student') as total_students,
  (select count(*) from public.courses where is_published = true) as published_courses,
  (select count(*) from public.enrollments) as total_enrollments,
  (select count(*) from public.certificates) as total_certificates;

-- Allow admins to manually enroll students
create policy "Admins can insert enrollments"
  on public.enrollments for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to delete enrollments
create policy "Admins can delete enrollments"
  on public.enrollments for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
