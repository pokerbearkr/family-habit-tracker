-- 건강 기록 테이블
CREATE TABLE health_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    family_id BIGINT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    systolic INT,
    diastolic INT,
    heart_rate INT,
    weight DOUBLE PRECISION,
    blood_sugar INT,
    note VARCHAR(500),
    measure_time VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE INDEX idx_health_records_user_type_date ON health_records(user_id, record_type, record_date);
CREATE INDEX idx_health_records_family_type_date ON health_records(family_id, record_type, record_date);
