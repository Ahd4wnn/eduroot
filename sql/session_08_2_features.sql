-- Session 08.2: Requirements, settings, certificate template

-- Add requirements column to courses
alter table public.courses
add column if not exists requirements text[]
default array[
  'A laptop or desktop computer',
  'Stable internet connection',
  'No prior experience needed'
];

-- Platform settings table (key-value store for admin config)
create table if not exists public.platform_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamptz default now()
);
alter table public.platform_settings enable row level security;

drop policy if exists "Admins can manage platform settings" on public.platform_settings;
create policy "Admins can manage platform settings"
  on public.platform_settings for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Anyone can read platform settings" on public.platform_settings;
create policy "Anyone can read platform settings"
  on public.platform_settings for select using (true);

-- Seed default settings
insert into public.platform_settings (key, value) values
  ('certificate_bg_url', null),
  ('platform_name', 'eduroot'),
  ('support_email', 'support@eduroot.online'),
  ('referral_reward_type', 'none')
on conflict (key) do nothing;
