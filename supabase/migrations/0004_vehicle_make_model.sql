-- Worker-facing car cards need "BMW X1" style display, not just a plate
-- number. PROVISIONAL free-text fields (not worker-editable — set by
-- whoever provisions the vehicle record).
alter table vehicle add column make text;
alter table vehicle add column model text;
