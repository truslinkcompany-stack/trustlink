-- Для тех, кто уже выполнил первую версию schema.sql. Данные сохраняются.
drop trigger if exists records_no_update on public.records;  -- на время миграции

alter table public.records alter column project_name drop not null;
alter table public.records drop constraint if exists records_project_name_check;
alter table public.records add constraint records_project_name_check check (char_length(project_name) <= 160);
alter table public.records add column if not exists author_name text check (char_length(author_name) <= 80);
alter table public.records add column if not exists place_name text;
alter table public.records add column if not exists device text;

create or replace function public.next_cert_no() returns text
language plpgsql as $$
declare n bigint := nextval('cert_seq');
begin
  return 'DS-' || to_char(now() at time zone 'utc', 'YYYY-MMDD') || '-' ||
         case when n < 1000 then lpad(n::text, 3, '0') else n::text end;
end $$;
alter table public.records alter column cert_no set default public.next_cert_no();

create trigger records_no_update before update or delete on public.records
  for each row execute function public.records_immutable();
