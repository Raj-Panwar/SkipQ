-- V7__create_admin_table.sql

CREATE TABLE admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    college_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_admins_college
        FOREIGN KEY (college_id)
        REFERENCES college(id),

    CONSTRAINT uq_admins_college_email
        UNIQUE (college_id, email)
);

CREATE INDEX idx_admins_college_id
ON admins(college_id);