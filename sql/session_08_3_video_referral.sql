-- Session 08.3: Referral system tables

-- Referral codes: every user gets one unique code
create table if not exists public.referral_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  code text unique not null
    default upper(
      substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)
    ),
  created_at timestamptz default now()
);
alter table public.referral_codes enable row level security;

drop policy if exists "Users can view own referral code" on public.referral_codes;
create policy "Users can view own referral code"
  on public.referral_codes for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all referral codes" on public.referral_codes;
create policy "Admins can view all referral codes"
  on public.referral_codes for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Users can insert own referral code" on public.referral_codes;
create policy "Users can insert own referral code"
  on public.referral_codes for insert
  with check (auth.uid() = user_id);

-- Referrals: track who referred whom
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete cascade unique,
  code text not null,
  status text default 'signed_up'
    check (status in ('signed_up', 'enrolled', 'rewarded')),
  created_at timestamptz default now()
);
alter table public.referrals enable row level security;

drop policy if exists "Users can view referrals they made" on public.referrals;
create policy "Users can view referrals they made"
  on public.referrals for select using (auth.uid() = referrer_id);

drop policy if exists "Users can insert referral on signup" on public.referrals;
create policy "Users can insert referral on signup"
  on public.referrals for insert with check (auth.uid() = referred_id);

drop policy if exists "Admins can view all referrals" on public.referrals;
create policy "Admins can view all referrals"
  on public.referrals for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create referral code for every new user
create or replace function public.handle_new_user_referral()
returns trigger as $$
begin
  insert into public.referral_codes (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_referral on auth.users;
create trigger on_auth_user_created_referral
  after insert on auth.users
  for each row execute procedure public.handle_new_user_referral();

-- Referral stats view for each user
create or replace view public.referral_stats as
select
  rc.user_id,
  rc.code,
  count(r.id)                                          as total_referrals,
  count(r.id) filter (where r.status = 'signed_up')   as signed_up,
  count(r.id) filter (where r.status = 'enrolled')    as enrolled,
  count(r.id) filter (where r.status = 'rewarded')    as rewarded
from public.referral_codes rc
left join public.referrals r on r.code = rc.code
group by rc.user_id, rc.code;

-- When a referred user enrolls in a course,
-- update their referral status to 'enrolled'
create or replace function public.handle_referral_on_enroll()
returns trigger as $$
begin
  update public.referrals
  set status = 'enrolled'
  where referred_id = new.user_id
    and status = 'signed_up';
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_enrollment_created_referral on public.enrollments;
create trigger on_enrollment_created_referral
  after insert on public.enrollments
  for each row execute procedure public.handle_referral_on_enroll();
