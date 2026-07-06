-- Assign every existing student to the default college
UPDATE students
SET college_id = (
    SELECT id
    FROM college
    WHERE code = 'COLLEGEXYZ'
)
WHERE college_id IS NULL;

-- Assign every existing product
UPDATE products
SET college_id = (
    SELECT id
    FROM college
    WHERE code = 'COLLEGEXYZ'
)
WHERE college_id IS NULL;

-- Assign every existing order
UPDATE orders
SET college_id = (
    SELECT id
    FROM college
    WHERE code = 'COLLEGEXYZ'
)
WHERE college_id IS NULL;

-- Assign every existing notification
UPDATE notifications
SET college_id = (
    SELECT id
    FROM college
    WHERE code = 'COLLEGEXYZ'
)
WHERE college_id IS NULL;