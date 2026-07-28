-- New-signup bootstrapping: every auth.users row gets its own organization
-- and a matching public.users row (role owner), so RLS's current_org_id()
-- always resolves for a freshly signed-up user.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  insert into organizations (name)
  values (coalesce(new.raw_user_meta_data->>'org_name', new.email) || '''s organization')
  returning id into v_org_id;

  insert into users (id, org_id, email, role)
  values (new.id, v_org_id, new.email, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Applicant intake: creates the applicant, its case file against the
-- current requirement pack for the property's jurisdiction, and one
-- case_item per requirement key, in a single transaction. security invoker
-- (the default) so it runs as the calling user and every insert is still
-- checked against that user's RLS policies.
create function create_applicant_case_file(
  p_property_id uuid,
  p_name text,
  p_email text,
  p_phone text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_jurisdiction_code text;
  v_pack_id uuid;
  v_requirements jsonb;
  v_applicant_id uuid;
  v_case_file_id uuid;
  v_item jsonb;
begin
  select jurisdiction_code into v_jurisdiction_code
  from properties
  where id = p_property_id;

  if v_jurisdiction_code is null then
    raise exception 'Property % not found', p_property_id;
  end if;

  select id, requirements into v_pack_id, v_requirements
  from requirement_packs
  where jurisdiction_code = v_jurisdiction_code
  order by version desc
  limit 1;

  if v_pack_id is null then
    raise exception 'No requirement pack found for jurisdiction %', v_jurisdiction_code;
  end if;

  insert into applicants (property_id, name, email, phone)
  values (p_property_id, p_name, p_email, p_phone)
  returning id into v_applicant_id;

  insert into case_files (applicant_id, requirement_pack_id)
  values (v_applicant_id, v_pack_id)
  returning id into v_case_file_id;

  for v_item in select * from jsonb_array_elements(v_requirements)
  loop
    insert into case_items (case_file_id, requirement_key, status)
    values (v_case_file_id, v_item ->> 'key', 'missing');
  end loop;

  insert into audit_log (case_file_id, event_type, event_payload, actor)
  values (
    v_case_file_id,
    'case_file_created',
    jsonb_build_object('applicant_id', v_applicant_id, 'requirement_pack_id', v_pack_id),
    auth.uid()
  );

  return v_case_file_id;
end;
$$;

grant execute on function create_applicant_case_file(uuid, text, text, text) to authenticated;
