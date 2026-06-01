-- Session 05: Progress tracking + certificates
-- NOTE: lesson_progress is a lightweight stub.
-- Full progress tracking (linked to video events) is deferred
-- until video hosting is decided. For now progress is manually
-- updated when a student marks a lesson complete.

create table if not exists public.lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;

-- Drop existing policies if any to prevent duplicates on rerun
drop policy if exists "Users can view own progress" on public.lesson_progress;
drop policy if exists "Users can upsert own progress" on public.lesson_progress;
drop policy if exists "Users can update own progress" on public.lesson_progress;
drop policy if exists "Admins can view all progress" on public.lesson_progress;

create policy "Users can view own progress"
  on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own progress"
  on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.lesson_progress for update using (auth.uid() = user_id);
create policy "Admins can view all progress"
  on public.lesson_progress for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Certificates table
create table if not exists public.certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  issued_at timestamptz default now(),
  certificate_id text unique default 'EDU-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  unique(user_id, course_id)
);
alter table public.certificates enable row level security;

-- Drop existing policies if any to prevent duplicates on rerun
drop policy if exists "Users can view own certificates" on public.certificates;
drop policy if exists "Admins can view all certificates" on public.certificates;

create policy "Users can view own certificates"
  on public.certificates for select using (auth.uid() = user_id);
create policy "Admins can view all certificates"
  on public.certificates for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Helper view: course progress per user
-- Returns: user_id, course_id, total_lessons, completed_lessons, progress_pct
create or replace view public.course_progress_view as
select
  e.user_id,
  e.course_id,
  c.title as course_title,
  c.total_lessons,
  count(lp.id) filter (where lp.completed = true) as completed_lessons,
  case
    when c.total_lessons = 0 then 0
    else round(
      (count(lp.id) filter (where lp.completed = true))::numeric
      / c.total_lessons * 100
    )
  end as progress_pct
from public.enrollments e
join public.courses c on c.id = e.course_id
left join public.lesson_progress lp
  on lp.course_id = e.course_id and lp.user_id = e.user_id
group by e.user_id, e.course_id, c.title, c.total_lessons;
