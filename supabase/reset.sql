-- DV Outdoor Advertising — full reset. Drops every table, function, and
-- type this project owns. Run this FIRST, then run
-- supabase/migrations/0001_schema.sql to rebuild.
--
-- Your Supabase Auth login (auth.users) is never touched by this — only the
-- app's own tables/functions/types are dropped.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists audit_log cascade;
drop table if exists alert_recipients cascade;
drop table if exists alerts cascade;
drop table if exists maintenance_requests cascade;
drop table if exists client_requests cascade;
drop table if exists rentals cascade;
drop table if exists companies cascade;
drop table if exists board_photos cascade;
drop table if exists board_status_history cascade;
drop table if exists boards cascade;
drop table if exists profiles cascade;

drop function if exists log_audit() cascade;
drop function if exists end_rental(uuid) cascade;
drop function if exists create_rental(uuid, uuid, numeric, rate_period, date, date, banner_printed_by, text) cascade;
drop function if exists record_board_status_update(uuid, board_status, text, text) cascade;
drop function if exists record_board_status_update(uuid, board_status, text) cascade;
drop function if exists current_app_role() cascade;
drop function if exists handle_new_user() cascade;
drop function if exists set_updated_at() cascade;

drop type if exists alert_category cascade;
drop type if exists alert_status cascade;
drop type if exists alert_type cascade;
drop type if exists photo_category cascade;
drop type if exists feedback_rating cascade;
drop type if exists maintenance_request_status cascade;
drop type if exists request_status cascade;
drop type if exists banner_printed_by cascade;
drop type if exists rental_status cascade;
drop type if exists rate_period cascade;
drop type if exists severity_level cascade;
drop type if exists size_category cascade;
drop type if exists lighting_type cascade;
drop type if exists board_status cascade;
drop type if exists board_type cascade;
drop type if exists user_role cascade;
