export type LogAction = 'login' | 'login_failed' | 'admin_login' | 'register' | 'logout' | 'upload' | 'proposal_create' | 'proposal_accept' | 'proposal_reject' | 'proposal_complete' | 'account_update' | 'account_deactivate' | 'admin_toggle_active' | 'admin_send_message' | 'dead_stock_delete' | 'password_reset_request' | 'password_reset_complete' | 'password_reset_failed' | 'drug_master_sync' | 'drug_master_package_upload' | 'drug_master_edit' | 'admin_verify_pharmacy';
export declare function writeLog(action: LogAction, options?: {
    pharmacyId?: number | null;
    detail?: string;
    resourceType?: string;
    resourceId?: string | number;
    metadataJson?: string | Record<string, unknown> | null;
    ipAddress?: string;
    errorCode?: string;
}): Promise<void>;
export declare function getClientIp(req: {
    ip?: string;
}): string;
//# sourceMappingURL=log-service.d.ts.map