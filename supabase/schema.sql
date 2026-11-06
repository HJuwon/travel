-- =========================================================
-- 여행 플래너 · Supabase 설정
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run
-- (여러 번 실행해도 안전합니다)
--
-- 구조
--   app_settings : 입장 비밀번호 (bcrypt 해시로만 저장)
--   trips        : 여행 데이터 전체 (JSON 한 덩어리) + 버전 번호
--   load_trip / save_trip : 비밀번호가 맞을 때만 읽기/쓰기
--   테이블은 직접 접근을 모두 막고, 위 두 함수로만 접근합니다.
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  pw_hash text not null
);

create table if not exists public.trips (
  id text primary key,
  data jsonb,
  version int not null default 0,
  updated_at timestamptz not null default now()
);

-- 직접 접근 차단 (RLS 켜고 정책은 만들지 않음)
alter table public.app_settings enable row level security;
alter table public.trips enable row level security;
revoke all on table public.app_settings, public.trips from anon, authenticated;

-- 비밀번호 확인 (틀리면 1초 쉬어서 무작위 대입을 느리게)
create or replace function public._check_pw(p_pw text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from app_settings where id = 1 and pw_hash = crypt(coalesce(p_pw, ''), pw_hash)) then
    return true;
  end if;
  perform pg_sleep(1);
  return false;
end $$;

-- 불러오기 → { data, version }
create or replace function public.load_trip(p_pw text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.trips;
begin
  if not _check_pw(p_pw) then
    raise exception 'bad password' using errcode = '28P01';
  end if;
  select * into r from trips where id = 'main';
  return jsonb_build_object('data', r.data, 'version', coalesce(r.version, 0));
end $$;

-- 저장하기 → { ok, version }
--   p_base: 내가 마지막으로 받은 버전. 그 사이 다른 사람이 저장했으면 ok=false (충돌)
create or replace function public.save_trip(p_pw text, p_data jsonb, p_base int) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v int;
begin
  if not _check_pw(p_pw) then
    raise exception 'bad password' using errcode = '28P01';
  end if;
  insert into trips as t (id, data, version) values ('main', p_data, 1)
  on conflict (id) do update
    set data = excluded.data, version = t.version + 1, updated_at = now()
    where t.version = p_base
  returning t.version into v;
  if v is null then
    return jsonb_build_object('ok', false, 'version', (select version from trips where id = 'main'));
  end if;
  return jsonb_build_object('ok', true, 'version', v);
end $$;

-- 함수 권한: 브라우저(anon)는 load_trip / save_trip 만 호출 가능
revoke all on function public._check_pw(text) from public, anon, authenticated;
revoke all on function public.load_trip(text), public.save_trip(text, jsonb, int) from public;
grant execute on function public.load_trip(text), public.save_trip(text, jsonb, int) to anon, authenticated;


-- =========================================================
-- ▼ 입장 비밀번호 설정 / 변경
--   '여기에_비밀번호' 부분을 바꿔서 이 문장만 실행하세요.
--   바꾸면 모든 기기가 로그아웃되고 새 비밀번호를 다시 입력해야 합니다.
-- =========================================================
-- insert into public.app_settings (id, pw_hash)
-- values (1, extensions.crypt('여기에_비밀번호', extensions.gen_salt('bf')))
-- on conflict (id) do update set pw_hash = excluded.pw_hash;
