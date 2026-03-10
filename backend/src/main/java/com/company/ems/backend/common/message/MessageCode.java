package com.company.ems.backend.common.message;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MessageCode {

    // ── Asset: CRUD ───────────────────────────────────────────────────────────
    ASSET_CREATED               ("asset.created"),
    ASSET_UPDATED               ("asset.updated"),
    ASSET_DELETED               ("asset.deleted"),
    ASSET_ASSIGNED              ("asset.assigned"),
    ASSET_RETURNED              ("asset.returned"),
    ASSET_CODE_PREVIEW          ("asset.code_preview"),

    ASSET_CANNOT_ASSIGN         ("asset.cannot_assign"),
    ASSET_CANNOT_RETURN         ("asset.cannot_return"),
    ASSET_CANNOT_DELETE         ("asset.cannot_delete"),

    ASSET_STATUS_AVAILABLE      ("asset.status.available"),
    ASSET_STATUS_ASSIGNED       ("asset.status.assigned"),
    ASSET_STATUS_RETIRED        ("asset.status.retired"),
    ASSET_STATUS_AVAILABLE_UPPER("asset.status.available.upper"),
    ASSET_STATUS_ASSIGNED_UPPER ("asset.status.assigned.upper"),
    ASSET_STATUS_RETIRED_UPPER  ("asset.status.retired.upper"),

    ASSET_CONDITION_NEW         ("asset.condition.new"),
    ASSET_CONDITION_GOOD        ("asset.condition.good"),
    ASSET_CONDITION_DAMAGED     ("asset.condition.damaged"),
    ASSET_CONDITION_LOST        ("asset.condition.lost"),
    ASSET_CONDITION_DISPOSED    ("asset.condition.disposed"),

    ASSET_ACTION_ASSIGN         ("asset.action.assign"),
    ASSET_ACTION_RETURN         ("asset.action.return"),
    ASSET_ACTION_UPDATE         ("asset.action.update"),

    ASSET_HISTORY_CREATED       ("asset.history.created"),
    ASSET_HISTORY_UPDATED       ("asset.history.updated"),
    ASSET_HISTORY_DELETED       ("asset.history.deleted"),
    ASSET_HISTORY_ASSIGNED      ("asset.history.assigned"),
    ASSET_HISTORY_RETURNED      ("asset.history.returned"),
    ASSET_HISTORY_CONDITION     ("asset.history.condition_changed"),

    ASSET_CSV_HEADER            ("asset.csv.header"),
    ASSET_VALIDATION_NAME       ("asset.validation.name_required"),
    ASSET_VALIDATION_EMP_ID     ("asset.validation.employee_id_required"),

    // ── Incident ──────────────────────────────────────────────────────────────
    INCIDENT_SUBMITTED          ("incident.submitted"),
    INCIDENT_APPROVED           ("incident.approved"),
    INCIDENT_REJECTED           ("incident.rejected"),
    INCIDENT_NOT_FOUND          ("incident.not_found"),
    INCIDENT_ACCESS_DENIED      ("incident.access_denied"),
    INCIDENT_ASSET_NOT_ASSIGNED ("incident.asset_not_assigned"),
    INCIDENT_ALREADY_PROCESSED  ("incident.already_processed"),
    INCIDENT_FILE_INVALID_TYPE  ("incident.file.invalid_type"),
    INCIDENT_FILE_TOO_LARGE     ("incident.file.too_large"),

    // ── Page entity names ─────────────────────────────────────────────────────
    PAGE_ENTITY_ASSET           ("page.entity.asset"),
    PAGE_ENTITY_REPORT          ("page.entity.report"),
    PAGE_ENTITY_HISTORY         ("page.entity.history"),
    PAGE_ENTITY_EMPLOYEE        ("page.entity.employee"),

    // ── Common ────────────────────────────────────────────────────────────────
    COMMON_NOT_FOUND            ("common.not_found"),
    COMMON_SUCCESS              ("common.success"),

    // ── Error: auth ───────────────────────────────────────────────────────────
    ERROR_UNAUTHENTICATED       ("error.unauthenticated"),
    ERROR_FORBIDDEN             ("error.forbidden"),
    ERROR_ACCOUNT_LOCKED        ("error.account_locked"),
    ERROR_ACCOUNT_DISABLED      ("error.account_disabled"),
    ERROR_BAD_CREDENTIALS       ("error.bad_credentials"),
    ERROR_ACCOUNT_LOCKED_DETAIL ("error.account_locked_detail"),
    ERROR_REFRESH_TOKEN_INVALID ("error.refresh_token_invalid"),
    ERROR_TOKEN_EXPIRED         ("error.token_expired"),
    ERROR_TOKEN_INVALID         ("error.token_invalid"),
    ERROR_TOKEN_MISSING         ("error.token_missing"),
    ERROR_UNAUTHORIZED          ("error.unauthorized"),

    // ── Error: request ────────────────────────────────────────────────────────
    ERROR_VALIDATION_FAILED     ("error.validation_failed"),
    ERROR_INVALID_REQUEST       ("error.invalid_request"),
    ERROR_INVALID_PARAMETER     ("error.invalid_parameter"),
    ERROR_MISSING_PARAMETER     ("error.missing_parameter"),
    ERROR_METHOD_NOT_SUPPORTED  ("error.method_not_supported"),
    ERROR_DUPLICATE_ENTRY       ("error.duplicate_entry"),
    ERROR_UNEXPECTED            ("error.unexpected"),

    // ── Employee ──────────────────────────────────────────────────────────────
    EMPLOYEE_CREATED            ("employee.created"),
    EMPLOYEE_UPDATED            ("employee.updated"),
    EMPLOYEE_DELETED            ("employee.deleted"),
    EMPLOYEE_FILE_UPLOADED      ("employee.file_uploaded"),
    EMPLOYEE_IMPORTED           ("employee.imported"),
    EMPLOYEE_NOT_FOUND_FOR_USER ("employee.not_found_for_user"),

    // ── Leave ─────────────────────────────────────────────────────────────────
    LEAVE_CREATED               ("leave.created"),
    LEAVE_PROCESSED             ("leave.processed"),
    LEAVE_CANCELLED             ("leave.cancelled"),
    LEAVE_INVALID_DATE_RANGE    ("leave.invalid_date_range"),
    LEAVE_INVALID_START_DATE    ("leave.invalid_start_date"),
    LEAVE_CANNOT_SELF_APPROVE   ("leave.cannot_self_approve"),
    LEAVE_INVALID_STATUS        ("leave.invalid_status"),
    LEAVE_NOT_PENDING           ("leave.not_pending"),
    LEAVE_CANNOT_CANCEL         ("leave.cannot_cancel"),
    LEAVE_SELF_APPROVE_FORBIDDEN ("leave.self_approve_forbidden"),
    LEAVE_CANCEL_FORBIDDEN ("leave.cancel_forbidden"),

    INVALID_STATUS ("invalid.status"),

    // ── Attendance ────────────────────────────────────────────────────────────
    ATTENDANCE_CHECKIN_SUCCESS  ("attendance.checkin_success"),
    ATTENDANCE_CHECKOUT_SUCCESS ("attendance.checkout_success"),
    ATTENDANCE_ALREADY_CHECKIN  ("attendance.already_checked_in"),
    ATTENDANCE_ALREADY_CHECKOUT ("attendance.already_checked_out"),
    ATTENDANCE_NOT_CHECKED_IN   ("attendance.not_checked_in"),

    // ── Attendance Adjustment ─────────────────────────────────────────────────
    ADJUSTMENT_SUBMITTED        ("adjustment.submitted"),
    ADJUSTMENT_RESUBMITTED      ("adjustment.resubmitted"),
    ADJUSTMENT_APPROVED         ("adjustment.approved"),
    ADJUSTMENT_REJECTED         ("adjustment.rejected"),
    ADJUSTMENT_RETURNED         ("adjustment.returned"),
    ADJUSTMENT_INVALID_STATE    ("adjustment.invalid_state"),
    ADJUSTMENT_MISSING_TIME     ("adjustment.missing_proposed_time"),
    ADJUSTMENT_REASON_REQUIRED  ("adjustment.reason_required"),
    ADJUSTMENT_NEEDS_NEXT_LEVEL ("adjustment.needs_next_level"),
    ADJUSTMENT_REJECT_REASON    ("adjustment.reject_reason_required"),
    ADJUSTMENT_RETURN_REASON    ("adjustment.return_reason_required"),
    ADJUSTMENT_NOTIFY_NEW       ("adjustment.notify.new"),
    ADJUSTMENT_NOTIFY_RESUBMIT  ("adjustment.notify.resubmitted"),
    ADJUSTMENT_NOTIFY_APPROVED  ("adjustment.notify.approved"),
    ADJUSTMENT_NOTIFY_REJECTED  ("adjustment.notify.rejected"),
    ADJUSTMENT_NOTIFY_RETURNED  ("adjustment.notify.returned"),
    ADJUSTMENT_NOTIFY_NEXT_LEVEL("adjustment.notify.next_level"),
    ADJUSTMENT_AUTO_UPDATED     ("adjustment.auto_updated"),

    // ── Password ──────────────────────────────────────────────────────────────
    PASSWORD_EMPTY              ("password.empty"),
    PASSWORD_TOO_SHORT          ("password.too_short"),
    PASSWORD_NO_UPPERCASE       ("password.no_uppercase"),
    PASSWORD_NO_LOWERCASE       ("password.no_lowercase"),
    PASSWORD_NO_DIGIT           ("password.no_digit"),
    PASSWORD_NO_SPECIAL         ("password.no_special"),
    PASSWORD_SAME_AS_OLD        ("password.same_as_old"),
    PASSWORD_MISMATCH           ("password.mismatch"),
    PASSWORD_INCORRECT          ("password.incorrect"),

    // ── 2FA ───────────────────────────────────────────────────────────────────
    TWO_FA_ALREADY_ENABLED      ("2fa.already_enabled"),
    TWO_FA_NOT_INITIATED        ("2fa.not_initiated"),
    TWO_FA_NOT_ENABLED          ("2fa.not_enabled"),
    TWO_FA_INVALID_CODE         ("2fa.invalid_code"),
    TWO_FA_INVALID_PASSWORD_CODE("2fa.invalid_password_or_code"),
    TWO_FA_RECOVERY_FAILED      ("2fa.recovery_code_failed"),
    TWO_FA_SETUP_MSG            ("2fa.setup_message"),
    TWO_FA_ENABLED_MSG          ("2fa.enabled_message"),
    TWO_FA_DISABLED_MSG         ("2fa.disabled_message"),

    // ── Audit Log ─────────────────────────────────────────────────────────────
    AUDIT_LOG_LIST              ("auditlog.list"),
    AUDIT_LOG_DETAIL            ("auditlog.detail"),

    // ── Workflow ──────────────────────────────────────────────────────────────
    WORKFLOW_DUPLICATE_LEVEL    ("workflow.duplicate_level"),
    WORKFLOW_MISSING_ROLE       ("workflow.missing_assignee_role"),
    WORKFLOW_MISSING_USER       ("workflow.missing_assignee_user");

    private final String key;
}