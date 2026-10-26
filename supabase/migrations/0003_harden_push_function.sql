-- Fixes the Supabase advisor warning "function_search_path_mutable" for replace_push_reminders.
-- The search path is pinned to empty, so every name is written with its schema. Same behaviour as 0001.
create or replace function public.replace_push_reminders(p_device_id uuid, p_reminders jsonb)
returns void
language sql
set search_path = ''
as $$
  with old as (
    delete from public.push_reminders where device_id = p_device_id
    returning kind, reminder_type, time_local, days, send_at, last_sent_at
  ),
  incoming as (
    select
      r->>'kind' as kind,
      r->>'reminder_type' as reminder_type,
      r->>'time_local' as time_local,
      case
        when pg_catalog.jsonb_typeof(r->'days') = 'array'
        then array(select pg_catalog.jsonb_array_elements_text(r->'days')::smallint)
      end as days,
      (r->>'send_at')::timestamptz as send_at
    from pg_catalog.jsonb_array_elements(p_reminders) as r
  )
  insert into public.push_reminders (device_id, kind, reminder_type, time_local, days, send_at, last_sent_at)
  select
    p_device_id, n.kind, n.reminder_type, n.time_local, n.days, n.send_at,
    (
      select max(o.last_sent_at) from old o
      where o.kind = n.kind
        and o.reminder_type = n.reminder_type
        and o.time_local is not distinct from n.time_local
        and o.days is not distinct from n.days
        and o.send_at is not distinct from n.send_at
    )
  from incoming n;
$$;

-- "create or replace" keeps the grants from 0001, but repeat them so this file stands alone.
revoke all on function public.replace_push_reminders(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_push_reminders(uuid, jsonb) to service_role;
