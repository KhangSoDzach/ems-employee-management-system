import api from '@/lib/axios';

// ─── Enums (mirror backend) ───────────────────────────────────────────────────
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'RETIRED';
export type AssetCondition = 'NEW' | 'GOOD' | 'DAMAGED' | 'LOST' | 'DISPOSED';

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
    AVAILABLE: 'Sẵn dùng',
    ASSIGNED: 'Đang cấp phát',
    RETIRED: 'Đã thu hồi',
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    RETIRED: 'bg-yellow-100 text-yellow-700',
};

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
    NEW: 'Mới',
    GOOD: 'Tốt',
    DAMAGED: 'Hư hỏng',
    LOST: 'Thất lạc',
    DISPOSED: 'Thanh lý',
};

// ─── Employee for assign dropdown ────────────────────────────────────────────
export interface EmployeeOption {
    id: number;
    firstName: string;
    lastName: string;
    department: string | null;
    position: string | null;
    avatarUrl: string | null;
}

// ─── Asset list summary ───────────────────────────────────────────────────────
export interface AssetSummary {
    id: string;          // Long as string from backend (mapper stringifies)
    name: string;
    desc: string | null;
    type: string | null;
    status: string;
    statusColor: string;
    user: string | null;
}

// ─── Asset detail ─────────────────────────────────────────────────────────────
export interface AssetDetail {
    name: string;
    code: string;
    type: string | null;
    value: string | null;
    purchaseDate: string | null;
    status: AssetStatus;
    condition: AssetCondition;
    warranty: string | null;
    supplier: string | null;
    contract: string | null;
    location: string | null;
    description: string | null;
    imageUrl: string | null;
    recentHistory: AssetHistoryItem[];
}

export interface AssetHistoryItem {
    id: number;
    type: string;
    action: string;
    user: string;
    description: string;
    date: string;
}

export interface AssetCreatePayload {
    assetName: string;
    assetType?: string;
    assetValue?: number;
    purchaseDate?: string;          // ISO date
    initialStatus?: AssetStatus;
    condition?: AssetCondition;
    location?: string;
    notes?: string;
    description?: string;
    warrantyUntil?: string;         // ISO date
    supplierName?: string;
    contractUntil?: string;         // ISO date
    imageUrl?: string;
    contractNumber?: string;
}

export interface AssetUpdatePayload {
    name?: string;
    type?: string;
    description?: string;
    value?: number;
    purchaseDate?: string;          // ISO date
    warrantyDate?: string;          // ISO date string
    supplier?: string;
    contractDate?: string;          // ISO date string
    condition?: AssetCondition;
    note?: string;
    image?: string;
    locationOrUser?: string;
    contractNumber?: string;
}

export interface AssignPayload {
    employeeId: number;
    notes?: string;
}

export interface ReturnPayload {
    conditionOnReturn: AssetCondition;
    readyToReuse: boolean;
    notes?: string;
}

// ─── Employee asset (my assets) ───────────────────────────────────────────────
export interface MyAsset {
    id: number;
    name: string;
    tag: string;
    assetType: string;
    imageUrl: string | null;
}

export interface IncidentReportRow {
    id: number;
    reportId: string;
    asset: string;
    assetTag: string;
    issueType: string;
    dateReported: string;
    status: string;
    statusLabel: string;
    statusColor: string;
}

export interface IncidentReportDetail {
    id: number;
    reportId: string;
    asset: string;
    assetCode: string;
    assetTag: string;
    incidentType: string;
    incidentTypeLabel: string;
    description: string;
    attachmentUrl: string | null;
    status: string;
    statusLabel: string;
    statusColor: string;
    reportedBy: string;
    reportedAt: string;
    processedBy: string | null;
    processedAt: string | null;
    processNote: string | null;
    assetCondition: string;
    assetStatus: string;
}

export interface AdminIncidentListItem {
    id: number;
    reportId: string;
    asset: string;
    employeeName: string;
    issueType: string;
    issueTypeLabel: string;
    reportedAt: string;
    status: string;
    statusLabel: string;
    statusColor: string;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export const assetService = {
    getMyAssets: (): Promise<MyAsset[]> =>
        api.get<ApiResponse<PageResponse<MyAsset>>>('/my/assets')
            .then(res => res.data.data.content),

    submitReport: (assetId: number, data: { incidentType: string; description: string }, attachment?: File): Promise<IncidentReportDetail> => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (attachment) {
            formData.append('attachment', attachment);
        }
        return api.post<ApiResponse<IncidentReportDetail>>(`/assets/${assetId}/report`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data.data);
    },

    getMyReports: (page = 0, size = 10): Promise<PageResponse<IncidentReportRow>> =>
        api.get<ApiResponse<PageResponse<IncidentReportRow>>>('/my/reports', { params: { page, size } })
            .then(res => res.data.data),

    getMyReportDetail: (id: number): Promise<IncidentReportDetail> =>
        api.get<ApiResponse<IncidentReportDetail>>(`/my/reports/${id}`)
            .then(res => res.data.data),

    // Admin/HR APIs
    getAllReports: (params: { status?: string; employeeId?: number; fromDate?: string; toDate?: string; keyword?: string; page?: number; size?: number }): Promise<PageResponse<AdminIncidentListItem>> =>
        api.get<ApiResponse<PageResponse<AdminIncidentListItem>>>('/admin/asset-reports', { params })
            .then(res => res.data.data),

    getAdminReportDetail: (id: number): Promise<IncidentReportDetail> =>
        api.get<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}`)
            .then(res => res.data.data),

    approveReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        api.post<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}/approve`, { note })
            .then(res => res.data.data),

    rejectReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        api.post<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}/reject`, { note })
            .then(res => res.data.data),

    // ─── Asset Management (HR/Admin/Manager) ──────────────────────────────────
    listAssets: (params: {
        page?: number; size?: number;
        status?: AssetStatus; type?: string; keyword?: string;
    }): Promise<PageResponse<AssetSummary>> =>
        api.get<ApiResponse<PageResponse<AssetSummary>>>('/assets', { params })
            .then(res => res.data.data),

    getNextCode: (): Promise<string> =>
        api.get<ApiResponse<{ nextCode: string }>>('/assets/next-code')
            .then(res => res.data.data.nextCode),

    getAssetById: (id: number | string): Promise<AssetDetail> =>
        api.get<ApiResponse<AssetDetail>>(`/assets/${id}`)
            .then(res => res.data.data),

    createAsset: (payload: AssetCreatePayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>('/assets', payload)
            .then(res => res.data.data),

    updateAsset: (id: number | string, payload: AssetUpdatePayload): Promise<AssetDetail> =>
        api.put<ApiResponse<AssetDetail>>(`/assets/${id}`, payload)
            .then(res => res.data.data),

    deleteAsset: (id: number | string): Promise<void> =>
        api.delete(`/assets/${id}`).then(() => undefined),

    assignAsset: (id: number | string, payload: AssignPayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>(`/assets/${id}/assign`, payload)
            .then(res => res.data.data),

    returnAsset: (id: number | string, payload: ReturnPayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>(`/assets/${id}/return`, payload)
            .then(res => res.data.data),

    getHistory: (id: number | string, params: {
        historyType?: string; page?: number; size?: number;
    }): Promise<PageResponse<AssetHistoryItem>> =>
        api.get<ApiResponse<PageResponse<AssetHistoryItem>>>(`/assets/${id}/history`, { params })
            .then(res => res.data.data),

    exportHistory: (id: number | string): Promise<Blob> =>
        api.get(`/assets/${id}/history/export`, { responseType: 'blob' })
            .then(res => res.data),

    exportAssets: (params: { status?: AssetStatus; type?: string; keyword?: string; }): Promise<Blob> =>
        api.get('/assets/export', { params, responseType: 'blob' })
            .then(res => res.data),

    // Search employees for assign dropdown
    searchEmployees: (keyword: string, page = 0, size = 20): Promise<PageResponse<EmployeeOption>> =>
        api.get<ApiResponse<PageResponse<EmployeeOption>>>('/employees', {
            params: { search: keyword, page, size },
        }).then(res => res.data.data),
};
