CREATE TABLE otp_verification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    college_id BIGINT NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    pending_full_name VARCHAR(255),
    pending_phone_number VARCHAR(50),
    pending_password_hash VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uq_otp_email_college_purpose UNIQUE (email, college_id, purpose),
    CONSTRAINT fk_otp_college FOREIGN KEY (college_id) REFERENCES college (id)
);

CREATE INDEX idx_otp_expires_at ON otp_verification (expires_at);