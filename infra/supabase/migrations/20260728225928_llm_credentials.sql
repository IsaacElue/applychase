-- BYOK storage for the optional "polish with AI" chase-message step
-- (PRD §8.5 / §16 step 8). One row per org per provider; encrypted_key is
-- AES-256-GCM ciphertext (iv + authTag + ciphertext, base64), encrypted and
-- decrypted in application code with a server-only key that never reaches
-- Postgres or the client. `enabled` is a separate flag from "a key is
-- stored" so a landlord can turn the feature off without losing the key.
create table llm_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai')),
  encrypted_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

alter table llm_credentials enable row level security;

create policy "org members can manage their llm credentials" on llm_credentials
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

grant select, insert, update, delete on llm_credentials to authenticated;
