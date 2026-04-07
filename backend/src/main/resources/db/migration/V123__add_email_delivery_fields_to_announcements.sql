ALTER TABLE announcements
    ADD COLUMN email_delivery_requested BIT(1) NOT NULL DEFAULT b'0' AFTER target_audience,
    ADD COLUMN emailed_recipient_count INT NOT NULL DEFAULT 0 AFTER email_delivery_requested;

CREATE INDEX idx_announcements_email_delivery_requested ON announcements (email_delivery_requested);
