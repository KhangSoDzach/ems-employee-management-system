# Audit log metadata fix (2026-03-24)

## Issue

Một số bản ghi trong `audit_log` bị thiếu `ipAddress` và metadata liên quan (như `userAgent`, `correlationId`) khi service gọi `AuditLogService.logEvent(...)` với `RequestContext = null`.

## Root cause

`AuditLogService` trước đây chỉ ghi metadata nếu caller truyền `RequestContext`. Nhiều luồng nghiệp vụ (ví dụ asset incident) không truyền context nên dữ liệu mạng bị rỗng.

## Fix

`AuditLogService` được cập nhật theo hướng **best-effort fallback**:

- Nếu `RequestContext` thiếu dữ liệu hoặc `null`, service tự đọc request hiện tại từ `RequestContextHolder`.
- IP được resolve theo thứ tự ưu tiên: `X-Forwarded-For` → `Forwarded` → `X-Real-IP` → `CF-Connecting-IP` → `True-Client-IP` → `remoteAddr`.
- `User-Agent`, `Correlation ID` (`X-Correlation-ID` / `X-Request-ID`) được tự động điền nếu có.
- `clientType` được suy luận từ User-Agent khi chưa có (`WEB`/`MOBILE`/`API`).
- Không có request hiện tại thì vẫn ghi log bình thường, bỏ qua metadata còn thiếu (không fail nghiệp vụ).

## Regression tests

Đã thêm test: `AuditLogServiceTest`

1. `logEvent_usesCurrentHttpRequestMetadata_whenContextIsNull`
2. `logEvent_keepsBestEffortBehavior_whenNoRequestContextAvailable`
