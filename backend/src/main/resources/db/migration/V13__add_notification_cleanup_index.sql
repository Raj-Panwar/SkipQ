-- No existing index covers notifications.created_at (only FK columns like
-- student_id/college_id/order_id are indexed). The scheduled cleanup job
-- filters and deletes by created_at on every run, so without this index
-- each run would degrade into a full table scan as notifications grow.
CREATE INDEX idx_notifications_created_at ON notifications (created_at);