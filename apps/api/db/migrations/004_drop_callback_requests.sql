-- The website no longer takes call-back requests (customers phone the garage instead). Safe to run more than once.
-- This deletes any saved requests for good. To keep a copy first:
--   mysqldump -u abe -p abe_garage callback_requests > callback_requests_backup.sql
DROP TABLE IF EXISTS callback_requests;
