-- Session 08.5: XP + Badges + Leaderboard

-- Badges definition table
create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,           -- emoji icon
  color text not null,          -- hex card color
  xp_reward integer default 0,
  category text not null        -- 'course' | 'milestone' | 'social' | 'speed'
);

-- Seed all 9 badges
insert into public.badges
  (id, name, description, icon, color, xp_reward, category)
values
  -- Course completion
  (
    'digital-marketing-complete',
    'Growth Hacker',
    'Completed the Digital Marketing course',
    '🚀', '#0F3D2E', 100, 'course'
  ),
  (
    'graphic-designing-complete',
    'Visual Artist',
    'Completed the Graphic Designing course',
    '🎨', '#C8A96B', 100, 'course'
  ),
  (
    'video-editing-complete',
    'Video Pro',
    'Completed the Video Editing course',
    '🎬', '#1a1a1a', 100, 'course'
  ),
  -- Milestone
  (
    'first-step',
    'First Step',
    'Completed your very first lesson',
    '⚡', '#3B82F6', 25, 'milestone'
  ),
  (
    'halfway-hero',
    'Halfway Hero',
    'Reached 50% progress in any course',
    '🔥', '#F97316', 50, 'milestone'
  ),
  (
    'all-rounder',
    'All-Rounder',
    'Enrolled in all 3 courses',
    '🏆', '#8B5CF6', 150, 'milestone'
  ),
  (
    'first-enrollment',
    'Course Starter',
    'Enrolled in your first course',
    '📚', '#10B981', 25, 'milestone'
  ),
  -- Social
  (
    'community-builder',
    'Community Builder',
    'Successfully referred a friend who enrolled',
    '🤝', '#EC4899', 75, 'social'
  ),
  -- Speed
  (
    'speed-learner',
    'Speed Learner',
    'Completed a course within 14 days of enrolling',
    '⚡', '#EAB308', 75, 'speed'
  )
on conflict (id) do nothing;

-- User XP totals
create table if not exists public.user_xp (
  user_id uuid references auth.users(id) on delete cascade primary key,
  total_xp integer default 0,
  updated_at timestamptz default now()
);
alter table public.user_xp enable row level security;

-- Drop existing policies if they exist to prevent errors on multiple runs
drop policy if exists "Users can view own XP" on public.user_xp;
drop policy if exists "Admins can view all XP" on public.user_xp;

create policy "Users can view own XP"
  on public.user_xp for select using (auth.uid() = user_id);
create policy "Admins can view all XP"
  on public.user_xp for select using (
    exists (select 1 from public.profiles
      where id = auth.uid() and role = 'admin')
  );

-- XP transaction log
create table if not exists public.xp_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id text,
  created_at timestamptz default now()
);
alter table public.xp_transactions enable row level security;

-- Drop existing policies if they exist to prevent errors on multiple runs
drop policy if exists "Users can view own XP transactions" on public.xp_transactions;
drop policy if exists "Users can insert own XP transactions" on public.xp_transactions;

create policy "Users can view own XP transactions"
  on public.xp_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own XP transactions"
  on public.xp_transactions for insert with check (auth.uid() = user_id);

-- User badges earned
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  badge_id text references public.badges(id),
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);
alter table public.user_badges enable row level security;

-- Drop existing policies if they exist to prevent errors on multiple runs
drop policy if exists "Users can view own badges" on public.user_badges;
drop policy if exists "Users can insert own badges" on public.user_badges;
drop policy if exists "Anyone can view badges for leaderboard" on public.user_badges;

create policy "Users can view own badges"
  on public.user_badges for select using (auth.uid() = user_id);
create policy "Users can insert own badges"
  on public.user_badges for insert with check (auth.uid() = user_id);
create policy "Anyone can view badges for leaderboard"
  on public.user_badges for select using (true);

-- XP Leaderboard view
-- IMPORTANT: Only exposes full_name. No email, no user_id.
create or replace view public.xp_leaderboard as
select
  p.full_name,
  coalesce(x.total_xp, 0) as total_xp,
  count(distinct ub.badge_id) as badge_count,
  rank() over (
    order by coalesce(x.total_xp, 0) desc
  ) as rank
from public.profiles p
left join public.user_xp x on x.user_id = p.id
left join public.user_badges ub on ub.user_id = p.id
where p.role = 'student'
  and coalesce(x.total_xp, 0) > 0
group by p.full_name, x.total_xp
order by total_xp desc
limit 50;

-- Helper function: add XP to a user (upsert)
create or replace function public.add_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text default null
)
returns void as $$
begin
  -- Log transaction
  insert into public.xp_transactions
    (user_id, amount, reason, reference_id)
  values
    (p_user_id, p_amount, p_reason, p_reference_id);

  -- Upsert total
  insert into public.user_xp (user_id, total_xp, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set total_xp = public.user_xp.total_xp + p_amount,
        updated_at = now();
end;
$$ language plpgsql security definer;

-- Auto-award XP on first enrollment
create or replace function public.handle_enrollment_xp()
returns trigger as $$
declare
  enrollment_count integer;
begin
  -- Count how many courses this user is now enrolled in
  select count(*) into enrollment_count
  from public.enrollments
  where user_id = new.user_id;

  -- First enrollment: 25 XP + 'first-enrollment' badge
  if enrollment_count = 1 then
    perform public.add_xp(
      new.user_id, 25, 'first_enrollment', new.course_id::text
    );
  end if;

  -- Enrolled in all 3 courses: 150 XP + 'all-rounder' badge
  if enrollment_count = 3 then
    perform public.add_xp(
      new.user_id, 150, 'all_rounder', null
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_enrollment_xp on public.enrollments;
create trigger on_enrollment_xp
  after insert on public.enrollments
  for each row execute procedure public.handle_enrollment_xp();
