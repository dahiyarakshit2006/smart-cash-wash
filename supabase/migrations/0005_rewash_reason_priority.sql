-- Re-wash queue needs a reason and priority for the supervisor's own
-- triage view. This is supervisor-entered only (never worker-facing), so
-- it doesn't violate the "no free text in the worker flow" constraint.
alter table wash_record add column rewash_reason text;
alter table wash_record add column rewash_priority text check (rewash_priority in ('low', 'normal', 'high'));
