-- Session 09: Orders table already created in session_07.
-- Add index for faster lookups.

create index if not exists idx_orders_user_id
  on public.orders(user_id);

create index if not exists idx_orders_status
  on public.orders(status);

create index if not exists idx_orders_razorpay_order_id
  on public.orders(razorpay_order_id);

-- View for admin order reporting
create or replace view public.admin_orders as
select
  o.id,
  o.razorpay_order_id,
  o.razorpay_payment_id,
  o.amount,
  o.currency,
  o.status,
  o.created_at,
  o.paid_at,
  p.full_name as student_name,
  c.title     as course_title,
  c.slug      as course_slug
from public.orders o
join public.profiles p on p.id = o.user_id
join public.courses  c on c.id = o.course_id
order by o.created_at desc;

grant select on public.admin_orders to authenticated;
