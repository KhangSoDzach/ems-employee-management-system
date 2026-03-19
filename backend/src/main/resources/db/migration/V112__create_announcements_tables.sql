CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    deleted_at DATETIME NULL,
    is_deleted BIT(1) NOT NULL,
    deleted_by VARCHAR(255) NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    announcement_type VARCHAR(20) NOT NULL,
    target_audience VARCHAR(20) NOT NULL,
    published_at DATETIME NOT NULL,
    CONSTRAINT pk_announcements PRIMARY KEY (id)
);

CREATE INDEX idx_announcements_type ON announcements (announcement_type);
CREATE INDEX idx_announcements_target_audience ON announcements (target_audience);
CREATE INDEX idx_announcements_published_at ON announcements (published_at);
CREATE INDEX idx_announcements_deleted ON announcements (is_deleted);

CREATE TABLE IF NOT EXISTS announcement_targets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    deleted_at DATETIME NULL,
    is_deleted BIT(1) NOT NULL,
    deleted_by VARCHAR(255) NULL,
    announcement_id BIGINT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    department_id BIGINT NULL,
    role_id BIGINT NULL,
    CONSTRAINT pk_announcement_targets PRIMARY KEY (id),
    CONSTRAINT fk_announcement_targets_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_targets_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_targets_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX idx_announcement_targets_announcement ON announcement_targets (announcement_id);
CREATE INDEX idx_announcement_targets_department ON announcement_targets (department_id);
CREATE INDEX idx_announcement_targets_role ON announcement_targets (role_id);
CREATE INDEX idx_announcement_targets_type ON announcement_targets (target_type);

CREATE TABLE IF NOT EXISTS announcement_reads (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    deleted_at DATETIME NULL,
    is_deleted BIT(1) NOT NULL,
    deleted_by VARCHAR(255) NULL,
    announcement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_read BIT(1) NOT NULL,
    read_at DATETIME NULL,
    CONSTRAINT pk_announcement_reads PRIMARY KEY (id),
    CONSTRAINT uk_announcement_reads_announcement_user UNIQUE (announcement_id, user_id),
    CONSTRAINT fk_announcement_reads_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_reads_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads (user_id);
CREATE INDEX idx_announcement_reads_is_read ON announcement_reads (is_read);
CREATE INDEX idx_announcement_reads_user_read ON announcement_reads (user_id, is_read);
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads (announcement_id);
