-- chase_messages wasn't granted in the earlier authenticated-privileges
-- migration because nothing touched it yet (see that migration's comment
-- on why RLS alone isn't sufficient). Step 5 (chase message generation)
-- now writes to it.
grant select, insert on chase_messages to authenticated;
