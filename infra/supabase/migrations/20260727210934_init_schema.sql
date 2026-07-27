-- Initial schema for ApplyChase (PRD §10)
-- Case-file intake/chasing data model: orgs, properties, applicants,
-- jurisdiction requirement packs, case files/items, chase messages, audit log.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

-- Mirrors auth.users 1:1, adding org membership + role.
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default now()
);

create index users_org_id_idx on users (org_id);

create table properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  address text not null,
  unit text,
  jurisdiction_code text not null,
  created_at timestamptz not null default now()
);

create index properties_org_id_idx on properties (org_id);

create table applicants (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'complete', 'archived')),
  created_at timestamptz not null default now()
);

create index applicants_property_id_idx on applicants (property_id);

-- Versioned per jurisdiction; requirements is a jsonb array of
-- { key, label, description } items (see packages/requirements/*.yaml).
create table requirement_packs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_code text not null,
  version integer not null,
  requirements jsonb not null,
  created_at timestamptz not null default now(),
  unique (jurisdiction_code, version)
);

create table case_files (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants (id) on delete cascade,
  requirement_pack_id uuid not null references requirement_packs (id),
  created_at timestamptz not null default now()
);

create index case_files_applicant_id_idx on case_files (applicant_id);

create table case_items (
  id uuid primary key default gen_random_uuid(),
  case_file_id uuid not null references case_files (id) on delete cascade,
  requirement_key text not null,
  status text not null default 'missing' check (status in ('missing', 'received', 'flagged')),
  source_text text,
  matched_confidence numeric,
  matched_by text check (matched_by in ('rule', 'embedding', 'llm')),
  received_at timestamptz,
  reviewed_by uuid references users (id),
  created_at timestamptz not null default now(),
  unique (case_file_id, requirement_key)
);

create index case_items_case_file_id_idx on case_items (case_file_id);

create table chase_messages (
  id uuid primary key default gen_random_uuid(),
  case_file_id uuid not null references case_files (id) on delete cascade,
  method text not null check (method in ('template', 'llm', 'ollama')),
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index chase_messages_case_file_id_idx on chase_messages (case_file_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  case_file_id uuid not null references case_files (id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  actor uuid references users (id),
  created_at timestamptz not null default now()
);

create index audit_log_case_file_id_idx on audit_log (case_file_id);

-- Row Level Security: every table is scoped to the caller's organization,
-- reached by walking each table's foreign keys back to org_id.

create function current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from users where id = auth.uid();
$$;

alter table organizations enable row level security;
alter table users enable row level security;
alter table properties enable row level security;
alter table applicants enable row level security;
alter table requirement_packs enable row level security;
alter table case_files enable row level security;
alter table case_items enable row level security;
alter table chase_messages enable row level security;
alter table audit_log enable row level security;

create policy "org members can read their org" on organizations
  for select using (id = current_org_id());

create policy "org members can read each other" on users
  for select using (org_id = current_org_id());

create policy "org members can manage their properties" on properties
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "org members can manage their applicants" on applicants
  for all using (
    property_id in (select id from properties where org_id = current_org_id())
  ) with check (
    property_id in (select id from properties where org_id = current_org_id())
  );

-- Requirement packs are shared reference data, readable by any authenticated user.
create policy "authenticated users can read requirement packs" on requirement_packs
  for select using (auth.role() = 'authenticated');

create policy "org members can manage their case files" on case_files
  for all using (
    applicant_id in (
      select a.id from applicants a
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  ) with check (
    applicant_id in (
      select a.id from applicants a
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  );

create policy "org members can manage their case items" on case_items
  for all using (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  ) with check (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  );

create policy "org members can manage their chase messages" on chase_messages
  for all using (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  ) with check (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  );

create policy "org members can manage their audit log" on audit_log
  for all using (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  ) with check (
    case_file_id in (
      select cf.id from case_files cf
      join applicants a on a.id = cf.applicant_id
      join properties p on p.id = a.property_id
      where p.org_id = current_org_id()
    )
  );
