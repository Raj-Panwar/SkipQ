-- ===========================
-- Students
-- ===========================

ALTER TABLE students
ADD COLUMN college_id BIGINT NULL;

ALTER TABLE students
ADD CONSTRAINT fk_students_college
FOREIGN KEY (college_id)
REFERENCES college(id);

CREATE INDEX idx_students_college
ON students(college_id);


-- ===========================
-- Products
-- ===========================

ALTER TABLE products
ADD COLUMN college_id BIGINT NULL;

ALTER TABLE products
ADD CONSTRAINT fk_products_college
FOREIGN KEY (college_id)
REFERENCES college(id);

CREATE INDEX idx_products_college
ON products(college_id);


-- ===========================
-- Orders
-- ===========================

ALTER TABLE orders
ADD COLUMN college_id BIGINT NULL;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_college
FOREIGN KEY (college_id)
REFERENCES college(id);

CREATE INDEX idx_orders_college
ON orders(college_id);


-- ===========================
-- Notifications
-- ===========================

ALTER TABLE notifications
ADD COLUMN college_id BIGINT NULL;

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_college
FOREIGN KEY (college_id)
REFERENCES college(id);

CREATE INDEX idx_notifications_college
ON notifications(college_id);