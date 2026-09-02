-- A wash_record needs to exist the moment a worker opens a car (so the
-- pre-wash damage flag has something to attach to) but before it reaches a
-- terminal state. 0001 only allowed terminal statuses; add 'in_progress'.


alter table wash_record drop constraint wash_record_status_check;
alter table wash_record add constraint wash_record_status_check
  check (status in ('in_progress', 'done', 'not_in_slot', 'declined', 'blocked', 'already_clean'));
