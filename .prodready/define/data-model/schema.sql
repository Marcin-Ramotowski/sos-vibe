-- SOS (System Obsługi Studiów) — Schema Definition
-- Stack TBD (Design phase) — plain SQL DDL jako technology-agnostic reference
-- Database: PostgreSQL (required for ACID + SELECT FOR UPDATE support)

CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role   NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE courses (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    capacity       INT         NOT NULL CHECK (capacity > 0),
    enrolled_count INT         NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
    lecturer_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT enrolled_not_exceeds_capacity CHECK (enrolled_count <= capacity)
);

CREATE TABLE enrollments (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT enrollments_student_course_unique UNIQUE (student_id, course_id)
);

CREATE TABLE grades (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID    NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    value         NUMERIC(3,1) NOT NULL
                    CHECK (value IN (2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5)),
    graded_by_id  UUID    NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT grades_enrollment_unique UNIQUE (enrollment_id)
);

CREATE TABLE grade_audit_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id      UUID         NOT NULL REFERENCES grades(id),
    enrollment_id UUID         NOT NULL REFERENCES enrollments(id),
    old_value     NUMERIC(3,1),   -- NULL = pierwsze wystawienie oceny
    new_value     NUMERIC(3,1) NOT NULL,
    changed_by_id UUID         NOT NULL REFERENCES users(id),
    changed_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes: correctness (UNIQUE już powyżej jako constraints)

-- Indexes: performance
CREATE INDEX idx_enrollments_course_id   ON enrollments(course_id);
CREATE INDEX idx_enrollments_student_id  ON enrollments(student_id);
CREATE INDEX idx_courses_lecturer_id     ON courses(lecturer_id);
CREATE INDEX idx_grade_audit_grade_id    ON grade_audit_logs(grade_id);
CREATE INDEX idx_grade_audit_enrollment  ON grade_audit_logs(enrollment_id);
