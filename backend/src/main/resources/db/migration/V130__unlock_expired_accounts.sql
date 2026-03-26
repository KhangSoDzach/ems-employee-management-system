-- ═══════════════════════════════════════════════════════════════════
-- V130: Unlock user accounts whose lock period has expired
--
-- During earlier bugs, the audit log failure caused transactions to
-- roll back silently, which may have left accounts with stale
-- locked_until timestamps and/or elevated failed_login_attempts
-- even after the lock period expired.
--
-- This migration clears all expired locks so users can log in again.
-- ═══════════════════════════════════════════════════════════════════

UPDATE users
SET 
    failed_login_attempts = 0,
    locked_until          = NULL,
    account_non_locked    = TRUE
WHERE 
    locked_until IS NOT NULL
    AND locked_until < NOW();
