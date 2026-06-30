create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('client', 'attorney', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.fee_model as enum ('retainer', 'contingency', 'no_retainer', 'free_initial_review', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.availability_status as enum ('online', 'offline', 'busy', 'available');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.license_status as enum ('approved', 'pending', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role public.user_role not null default 'client',
  name text not null,
  email text unique not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  preferred_language text not null default 'English',
  location_permission boolean not null default false,
  stripe_customer_id text,
  default_payment_method_id text,
  emergency_contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.attorney_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  firm_name text not null,
  bar_license_number text not null,
  license_status public.license_status not null default 'pending',
  profile_photo_url text,
  short_bio text not null,
  full_bio text not null,
  years_experience integer not null default 0,
  languages text[] not null default '{}',
  office_address text,
  jurisdictions text[] not null default '{}',
  service_zip_codes text[] not null default '{}',
  availability_status public.availability_status not null default 'offline',
  rating numeric(2,1) not null default 5.0,
  subscription_status text not null default 'inactive',
  premium_listing_level text not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  default_fee_model public.fee_model not null default 'custom',
  active boolean not null default true
);

create table if not exists public.attorney_practice_areas (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid not null references public.attorney_profiles(id) on delete cascade,
  legal_category_id uuid not null references public.legal_categories(id) on delete cascade,
  fee_model public.fee_model not null,
  retainer_required boolean not null default false,
  retainer_amount integer,
  contingency_percentage numeric(5,2),
  preliminary_guidance_enabled boolean not null default true,
  preliminary_guidance_minutes integer not null default 5,
  custom_fee_text text,
  unique(attorney_id, legal_category_id)
);

create table if not exists public.attorney_availability (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid not null references public.attorney_profiles(id) on delete cascade,
  status public.availability_status not null default 'offline',
  last_seen_at timestamptz not null default now(),
  current_call_id uuid
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id),
  attorney_id uuid not null references public.attorney_profiles(id),
  legal_category_id uuid not null references public.legal_categories(id),
  status text not null default 'requested',
  video_room_id text not null,
  video_room_url text not null,
  started_at timestamptz,
  ended_at timestamptz,
  preliminary_guidance_seconds integer not null default 0,
  recording_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.call_notes (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  attorney_id uuid not null references public.attorney_profiles(id),
  notes text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id),
  attorney_id uuid not null references public.attorney_profiles(id),
  legal_category_id uuid not null references public.legal_categories(id),
  matter_type text not null,
  fee_model public.fee_model not null,
  status text not null default 'draft',
  agreement_id uuid,
  payment_id uuid,
  attorney_acceptance_status text not null default 'not_requested',
  representation_started_at timestamptz,
  incident_location text,
  incident_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.client_profiles(id),
  attorney_id uuid not null references public.attorney_profiles(id),
  agreement_type text not null,
  agreement_text text not null,
  signed_by_client boolean not null default false,
  client_signature text,
  client_signed_at timestamptz,
  attorney_accepted boolean not null default false,
  attorney_accepted_at timestamptz,
  fully_executed boolean not null default false,
  fully_executed_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.cases
  add constraint cases_agreement_id_fkey foreign key (agreement_id) references public.agreements(id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  client_id uuid not null references public.client_profiles(id),
  attorney_id uuid not null references public.attorney_profiles(id),
  stripe_payment_intent_id text,
  amount integer not null default 0,
  currency text not null default 'usd',
  payment_type text not null,
  status text not null default 'requires_payment_method',
  created_at timestamptz not null default now()
);

alter table public.cases
  add constraint cases_payment_id_fkey foreign key (payment_id) references public.payments(id);

create table if not exists public.case_exports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  attorney_id uuid not null references public.attorney_profiles(id),
  integration_type text not null,
  export_status text not null default 'pending',
  export_payload_json jsonb not null default '{}'::jsonb,
  pdf_packet_url text,
  exported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attorney_integrations (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid not null references public.attorney_profiles(id) on delete cascade,
  integration_type text not null,
  connected boolean not null default false,
  access_token_encrypted text,
  refresh_token_encrypted text,
  external_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attorney_id, integration_type)
);

create table if not exists public.attorney_subscriptions (
  id uuid primary key default gen_random_uuid(),
  attorney_id uuid not null references public.attorney_profiles(id) on delete cascade,
  stripe_subscription_id text,
  plan_name text not null,
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attorney_profiles_visibility
  on public.attorney_profiles (license_status, availability_status);
create index if not exists idx_attorney_practice_lookup
  on public.attorney_practice_areas (legal_category_id, attorney_id);
create index if not exists idx_cases_status
  on public.cases (status, attorney_acceptance_status);
create index if not exists idx_calls_client_attorney
  on public.calls (client_id, attorney_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists attorneys_touch_updated_at on public.attorney_profiles;
create trigger attorneys_touch_updated_at
before update on public.attorney_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists cases_touch_updated_at on public.cases;
create trigger cases_touch_updated_at
before update on public.cases
for each row execute function public.touch_updated_at();

alter table public.users enable row level security;
alter table public.client_profiles enable row level security;
alter table public.attorney_profiles enable row level security;
alter table public.legal_categories enable row level security;
alter table public.attorney_practice_areas enable row level security;
alter table public.attorney_availability enable row level security;
alter table public.calls enable row level security;
alter table public.call_notes enable row level security;
alter table public.cases enable row level security;
alter table public.agreements enable row level security;
alter table public.payments enable row level security;
alter table public.case_exports enable row level security;
alter table public.attorney_integrations enable row level security;
alter table public.attorney_subscriptions enable row level security;
alter table public.admin_logs enable row level security;

create or replace function public.current_app_role()
returns public.user_role language sql stable as $$
  select role from public.users where auth_user_id = auth.uid() limit 1;
$$;

create policy "public active legal categories" on public.legal_categories
  for select using (active = true);

create policy "public approved online attorneys" on public.attorney_profiles
  for select using (license_status = 'approved');

create policy "public attorney practice areas" on public.attorney_practice_areas
  for select using (
    exists (
      select 1 from public.attorney_profiles ap
      where ap.id = attorney_practice_areas.attorney_id
      and ap.license_status = 'approved'
    )
  );

create policy "users read self" on public.users
  for select using (auth_user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "clients manage own profile" on public.client_profiles
  for all using (
    exists (
      select 1 from public.users u
      where u.id = client_profiles.user_id
      and (u.auth_user_id = auth.uid() or public.current_app_role() = 'admin')
    )
  );

create policy "attorneys manage own profile" on public.attorney_profiles
  for all using (
    exists (
      select 1 from public.users u
      where u.id = attorney_profiles.user_id
      and (u.auth_user_id = auth.uid() or public.current_app_role() = 'admin')
    )
  );

create policy "case participants read cases" on public.cases
  for select using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.client_profiles cp join public.users u on u.id = cp.user_id
      where cp.id = cases.client_id and u.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.attorney_profiles ap join public.users u on u.id = ap.user_id
      where ap.id = cases.attorney_id and u.auth_user_id = auth.uid()
    )
  );

create policy "case participants read agreements" on public.agreements
  for select using (
    public.current_app_role() = 'admin'
    or exists (select 1 from public.cases c where c.id = agreements.case_id)
  );

create policy "admins manage all core tables" on public.admin_logs
  for all using (public.current_app_role() = 'admin');
