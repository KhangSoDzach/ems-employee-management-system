const fs = require('fs');
const path = require('path');

const dir = 'backend/src/main/java';

const replacements = [
    { from: /AuthActionType\.LOGIN_SUCCESS/g, to: 'AuditActionType.AUTH_LOGIN_SUCCESS' },
    { from: /AuthActionType\.LOGIN_FAILED/g, to: 'AuditActionType.AUTH_LOGIN_FAILED' },
    { from: /AuthActionType\.LOGOUT/g, to: 'AuditActionType.AUTH_LOGOUT' },
    { from: /AuthActionType\.TOKEN_EXPIRED/g, to: 'AuditActionType.AUTH_TOKEN_EXPIRED' },
    { from: /AuthActionType\.TOKEN_REFRESH_SUCCESS/g, to: 'AuditActionType.AUTH_TOKEN_REFRESH_SUCCESS' },
    { from: /AuthActionType\.TOKEN_REFRESH_FAILED/g, to: 'AuditActionType.AUTH_TOKEN_REFRESH_FAILED' },
    { from: /AuthActionType\.TOKEN_REVOKED/g, to: 'AuditActionType.AUTH_TOKEN_REVOKED' },
    { from: /AuthActionType\.TOKEN_INVALID/g, to: 'AuditActionType.AUTH_TOKEN_INVALID' },
    { from: /AuthActionType\.ACCESS_DENIED/g, to: 'AuditActionType.SECURITY_ACCESS_DENIED' },
    { from: /AuthActionType\.PASSWORD_CHANGED/g, to: 'AuditActionType.SYSTEM_PASSWORD_CHANGED' },
    { from: /AuthActionType\.ASSET_REPORT_SUBMITTED/g, to: 'AuditActionType.WORKFLOW_ASSET_REPORT_SUBMITTED' },
    { from: /AuthActionType\.ASSET_REPORT_APPROVED/g, to: 'AuditActionType.WORKFLOW_ASSET_REPORT_APPROVED' },
    { from: /AuthActionType\.ASSET_REPORT_REJECTED/g, to: 'AuditActionType.WORKFLOW_ASSET_REPORT_REJECTED' },
    { from: /AuthActionType/g, to: 'AuditActionType' },
];

function walkDir(d) {
    fs.readdirSync(d).forEach(f => {
        let fullPath = path.join(d, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.java')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            replacements.forEach(r => {
                content = content.replace(r.from, r.to);
            });
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    });
}

walkDir(dir);
