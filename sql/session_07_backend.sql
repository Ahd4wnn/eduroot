-- Session 07: Backend service role helpers
-- Run in Supabase SQL editor

-- Allow service role to read all profiles (for admin API verification)
-- The backend uses the service role key, bypassing RLS.
-- No additional SQL needed for core tables (already created in sessions 03-06).

-- Orders table (created here since payment logic lives in backend)
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null,              -- in paise (INR)
  currency text default 'INR',
  status text default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded')),
  created_at timestamptz default now(),
  paid_at timestamptz
);
alter table public.orders enable row level security;
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);
create policy "Admins can view all orders"
  on public.orders for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
-- Service role (backend) bypasses RLS — no insert policy needed for orders.

-- Add total_revenue to admin_stats view
create or replace view public.admin_stats as
select
  (select count(*) from public.profiles where role = 'student') as total_students,
  (select count(*) from public.courses where is_published = true) as published_courses,
  (select count(*) from public.enrollments) as total_enrollments,
  (select count(*) from public.certificates) as total_certificates,
  (select coalesce(sum(amount), 0) from public.orders where status = 'paid') as total_revenue_paise;
