-- RLS policies alone are not enough: Postgres also checks the base table
-- GRANT for the connecting role, and Supabase's default-privilege template
-- doesn't cover tables created by CLI migrations (they run as `postgres`,
-- not the role the template's `alter default privileges` was scoped to).
-- Grant explicitly here, and set default privileges for future tables
-- created by migrations so this doesn't need repeating.

grant select on organizations to authenticated;
grant select on users to authenticated;
grant select, insert, update, delete on properties to authenticated;
grant select, insert, update, delete on applicants to authenticated;
grant select on requirement_packs to authenticated;
grant select, insert, update, delete on case_files to authenticated;
grant select, insert, update, delete on case_items to authenticated;
grant select, insert on audit_log to authenticated;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;
