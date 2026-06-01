-- Session 03: Courses schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'name', -- matching full name parameter
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Courses table
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  short_desc text,
  long_desc text,
  thumbnail_url text,
  preview_video_url text,   -- YouTube/Vimeo embed URL (external, not uploaded)
  category text check (category in ('digital-marketing', 'graphic-designing', 'video-editing')),
  price integer default 4999,
  original_price integer default 6999,
  is_published boolean default false,
  total_lessons integer default 0,
  total_duration_mins integer default 0,
  skill_level text default 'Beginner' check (skill_level in ('Beginner', 'Intermediate', 'Advanced')),
  language text default 'English',
  last_updated date default current_date,
  created_at timestamptz default now()
);
alter table public.courses enable row level security;

create policy "Anyone can view published courses"
  on public.courses for select using (is_published = true);
create policy "Admins can do everything on courses"
  on public.courses for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Modules table
create table if not exists public.modules (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  order_index integer not null,
  created_at timestamptz default now()
);
alter table public.modules enable row level security;

create policy "Anyone can view modules of published courses"
  on public.modules for select using (
    exists (
      select 1 from public.courses
      where id = course_id and is_published = true
    )
  );
create policy "Admins can manage modules"
  on public.modules for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Enrollments table
create table if not exists public.enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);
alter table public.enrollments enable row level security;

create policy "Users can view own enrollments"
  on public.enrollments for select using (auth.uid() = user_id);
create policy "Admins can view all enrollments"
  on public.enrollments for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Lessons table
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  video_url text,           -- External URL only. No Supabase Storage.
  duration_mins integer default 0,
  is_preview boolean default false,
  order_index integer not null,
  created_at timestamptz default now()
);
alter table public.lessons enable row level security;

create policy "Anyone can view preview lessons"
  on public.lessons for select using (is_preview = true);
create policy "Enrolled users can view all lessons"
  on public.lessons for select using (
    exists (
      select 1 from public.enrollments
      where user_id = auth.uid()
      and course_id = (
        select course_id from public.modules where id = module_id
      )
    )
  );
create policy "Admins can manage lessons"
  on public.lessons for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed: 3 placeholder courses
insert into public.courses
  (title, slug, short_desc, long_desc, category, price, original_price,
   is_published, total_lessons, total_duration_mins, skill_level)
values
(
  'Digital Marketing Mastery',
  'digital-marketing',
  'From SEO to paid ads — learn to grow any business online.',
  'A comprehensive, project-based course covering every channel of digital marketing. You will learn SEO fundamentals, run real Google Ads campaigns, build social media strategies, set up email automations, and read analytics dashboards like a pro. Each module ends with a hands-on project that goes straight into your portfolio.',
  'digital-marketing', 4999, 6999, true, 42, 1140, 'Beginner'
),
(
  'Graphic Designing Fundamentals',
  'graphic-designing',
  'Create stunning visuals using industry-standard tools.',
  'Master the principles of visual design from scratch. You will learn Canva for quick professional work, Figma for product and UI design, brand identity creation, social media graphics, and basic UI/UX thinking. The course is built around a final brand identity project you design from brief to delivery.',
  'graphic-designing', 4999, 6999, true, 38, 980, 'Beginner'
),
(
  'Video Editing Pro',
  'video-editing',
  'Edit professional videos for YouTube, Reels, and beyond.',
  'Go from raw footage to polished, publish-ready videos. You will learn editing in both Premiere Pro and CapCut, colour grading, motion text and transitions, audio mixing, and exporting for every platform. The final project is a full YouTube video + 3 Reels edits you can publish the same day.',
  'video-editing', 4999, 6999, true, 36, 920, 'Beginner'
);
