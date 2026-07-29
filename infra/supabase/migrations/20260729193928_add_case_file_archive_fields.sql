-- Archive, never delete: this is a compliance/audit-trail tool, so a case
-- file that's no longer active (leased, applicant withdrew, duplicate
-- entry, etc.) gets marked archived rather than removed. archived_at being
-- null is what the default Case Files list filters on; archive_reason is
-- required whenever archived_at is set, so there's always a stated reason
-- on record, consistent with the rest of the audit trail.
alter table case_files
  add column archived_at timestamptz,
  add column archive_reason text;

alter table case_files
  add constraint case_files_archive_reason_required
  check (
    (archived_at is null and archive_reason is null)
    or (archived_at is not null and archive_reason is not null)
  );
