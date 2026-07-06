CREATE TABLE college (
    id BIGINT NOT NULL AUTO_INCREMENT,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    domain VARCHAR(150),
    logo_url VARCHAR(500),

    contact_email VARCHAR(150),
    contact_phone VARCHAR(30),

    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_college PRIMARY KEY (id),
    CONSTRAINT uk_college_code UNIQUE (code)
);

CREATE INDEX idx_college_active
ON college(active);