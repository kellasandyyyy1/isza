-- Adds "water" to the reminder types. Water reminders are recurring times like the others: the server stores
-- the type, the local time and the weekdays, never a count or anything she logged.
-- 0001 created the check inline, so Postgres named it push_reminders_reminder_type_check.

alter table public.push_reminders
  drop constraint if exists push_reminders_reminder_type_check;

alter table public.push_reminders
  add constraint push_reminders_reminder_type_check
  check (reminder_type in ('check-in', 'pill', 'supplement', 'custom', 'planner', 'water'));
