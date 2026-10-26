-- Web Push for Isza. The server stores only what is needed to send a reminder at the right time:
-- a random device ID, the push subscription, the time zone, the discreet flag and reminder times.
-- Never labels, notes, cycle days, phases, predictions, symptoms or any log data.

create table push_subscriptions (
  device_id uuid primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  timezone text not null,
  discreet boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table push_reminders (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references push_subscriptions(device_id) on delete cascade,
  kind text not null check (kind in ('recurring', 'once')),
  reminder_type text not null check (reminder_type in ('check-in', 'pill', 'supplement', 'custom', 'planner')),
  time_local text check (time_local ~ '^[0-2][0-9]:[0-5][0-9]$'),
  days smallint[],
  send_at timestamptz,
  last_sent_at timestamptz
);

create index on push_reminders (device_id);

alter table push_subscriptions enable row level security;
alter table push_reminders enable row level security;
-- No RLS policies, so only the service role can read or write.

-- Replaces all reminders of one device in a single transaction (one statement).
-- A reminder that is unchanged keeps its last_sent_at, so a sync never causes a repeat.
create or replace function replace_push_reminders(p_device_id uuid, p_reminders jsonb)
returns void
language sql
as $$
  with old as (
    delete from push_reminders where device_id = p_device_id
    returning kind, reminder_type, time_local, days, send_at, last_sent_at
  ),
  incoming as (
    select
      r->>'kind' as kind,
      r->>'reminder_type' as reminder_type,
      r->>'time_local' as time_local,
      case
        when jsonb_typeof(r->'days') = 'array'
        then array(select jsonb_array_elements_text(r->'days')::smallint)
      end as days,
      (r->>'send_at')::timestamptz as send_at
    from jsonb_array_elements(p_reminders) as r
  )
  insert into push_reminders (device_id, kind, reminder_type, time_local, days, send_at, last_sent_at)
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

-- Only the server (service role) may call it.
revoke all on function replace_push_reminders(uuid, jsonb) from public, anon, authenticated;
grant execute on function replace_push_reminders(uuid, jsonb) to service_role;
