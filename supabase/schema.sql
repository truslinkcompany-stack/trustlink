-- ДоброСлед / TrustLink, Фаза 1. Выполнить целиком в Supabase -> SQL Editor (на чистом проекте).
-- Если старую версию схемы уже запускали, выполните вместо этого supabase/migration_002.sql

create extension if not exists pgcrypto;
create sequence if not exists cert_seq start 1;

-- Номер вида DS-2026-1012-003 (дата создания + сквозной счётчик)
create or replace function public.next_cert_no() returns text
language plpgsql as $$
declare n bigint := nextval('cert_seq');
begin
  return 'DS-' || to_char(now() at time zone 'utc', 'YYYY-MMDD') || '-' ||
         case when n < 1000 then lpad(n::text, 3, '0') else n::text end;
end $$;

create table if not exists public.records (
  id           uuid primary key default gen_random_uuid(),
  cert_no      text not null unique default public.next_cert_no(),
  created_at   timestamptz not null default now(),   -- время сервера (UTC)
  client_time  timestamptz,                          -- время телефона, не проверено
  client_tz    text,                                 -- часовой пояс телефона
  lat          numeric(9,6),
  lng          numeric(9,6),
  accuracy_m   numeric(10,1),
  place_name   text,                                 -- город/район по координатам (может быть пустым)
  device       text,                                 -- упрощённое название устройства
  sha256       text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  file_path    text not null,
  project_name text check (char_length(project_name) <= 160),   -- необязательно: проект и организация
  author_name  text check (char_length(author_name) <= 80),     -- необязательно
  description  text check (char_length(description) <= 300),    -- необязательно: «Выполнено»
  user_agent   text,
  status       text not null default 'valid' check (status in ('valid','revoked'))
);

alter table public.records enable row level security;
revoke all on public.records from anon, authenticated;

-- Append-only: запись нельзя изменить или удалить, даже с сервера.
create or replace function public.records_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'records are append-only';
end $$;

drop trigger if exists records_no_update on public.records;
create trigger records_no_update before update or delete on public.records
  for each row execute function public.records_immutable();

-- Закрытое хранилище фото
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do update set public = false;
