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
    dbId?: number;
    id: string;
    name: string;
    desc: string | null;
    type: string | null;
    status: string;
    statusColor: string;
    user: string | null;
}

// ─── Asset detail ─────────────────────────────────────────────────────────────
export interface AssetDetail {
    id?: number;
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
    purchaseDate?: string;
    initialStatus?: AssetStatus;
    condition?: AssetCondition;
    location?: string;
    notes?: string;
    description?: string;
    warrantyUntil?: string;
    supplierName?: string;
    contractUntil?: string;
    imageUrl?: string;
    contractNumber?: string;
}

export interface AssetUpdatePayload {
    name?: string;
    type?: string;
    description?: string;
    value?: number;
    purchaseDate?: string;
    warrantyDate?: string;
    supplier?: string;
    contractDate?: string;
    condition?: AssetCondition;
    note?: string;
    image?: string;
    locationOrUser?: string;
    assignedEmployeeId?: number;
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

// ─────────────────────────────────────────────────────────────────────────────
// HOW THE AXIOS INTERCEPTOR WORKS:
//   api.interceptors.response.use((response) => response.data)
//
// The interceptor already unwraps AxiosResponse and returns response.data
// which IS the raw HTTP body = ApiResponse<T> = { success, message, data: T }
//
// So in .then(res => ...), `res` is already ApiResponse<T>:
//   CORRECT: .then(res => res.data)       → gets T ✓
//   WRONG:   .then(res => res.data.data)  → undefined 💥 (old bug)
// ─────────────────────────────────────────────────────────────────────────────

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

// Helper type: cast api call result as ApiResponse<T> promise
type AR<T> = Promise<ApiResponse<T>>;

export const assetService = {

    // ─── Employee: My Assets ──────────────────────────────────────────────────

    getMyAssets: (): Promise<MyAsset[]> =>
        (api.get('/my/assets') as unknown as AR<PageResponse<MyAsset>>)
            .then(res => res.data.content),

    submitReport: (
        assetId: number,
        data: { incidentType: string; description: string },
        attachment?: File
    ): Promise<IncidentReportDetail> => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (attachment) formData.append('attachment', attachment);
        return (api.post(`/assets/${assetId}/report`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }) as unknown as AR<IncidentReportDetail>)
            .then(res => res.data);
    },

    getMyReports: (page = 0, size = 10): Promise<PageResponse<IncidentReportRow>> =>
        (api.get('/my/reports', { params: { page, size } }) as unknown as AR<PageResponse<IncidentReportRow>>)
            .then(res => res.data),

    getMyReportDetail: (id: number): Promise<IncidentReportDetail> =>
        (api.get(`/my/reports/${id}`) as unknown as AR<IncidentReportDetail>)
            .then(res => res.data),

    // ─── Admin/HR: Incident Reports ───────────────────────────────────────────

    getAllReports: (params: {
        status?: string; employeeId?: number; fromDate?: string;
        toDate?: string; keyword?: string; page?: number; size?: number;
    }): Promise<PageResponse<AdminIncidentListItem>> =>
        (api.get('/admin/asset-reports', { params }) as unknown as AR<PageResponse<AdminIncidentListItem>>)
            .then(res => res.data),

    getAdminReportDetail: (id: number): Promise<IncidentReportDetail> =>
        (api.get(`/admin/asset-reports/${id}`) as unknown as AR<IncidentReportDetail>)
            .then(res => res.data),

    approveReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        (api.post(`/admin/asset-reports/${id}/approve`, { note }) as unknown as AR<IncidentReportDetail>)
            .then(res => res.data),

    rejectReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        (api.post(`/admin/asset-reports/${id}/reject`, { note }) as unknown as AR<IncidentReportDetail>)
            .then(res => res.data),

    // ─── Asset Management (Admin/HR/Manager) ──────────────────────────────────

    listAssets: (params: {
        page?: number; size?: number;
        status?: AssetStatus; type?: string; keyword?: string;
    }): Promise<PageResponse<AssetSummary>> =>
        (api.get('/assets', { params }) as unknown as AR<PageResponse<AssetSummary>>)
            .then(res => res.data),

    /** Returns auto-generated code preview (e.g. "TS-001") */
    getNextCode: (): Promise<string> =>
        (api.get('/assets/next-code') as unknown as AR<{ nextCode: string }>)
            .then(res => res.data.nextCode),

    getAssetById: (id: number | string): Promise<AssetDetail> =>
        (api.get(`/assets/${id}`) as unknown as AR<AssetDetail>)
            .then(res => res.data),

    createAsset: (payload: AssetCreatePayload): Promise<AssetDetail> =>
        (api.post('/assets', payload) as unknown as AR<AssetDetail>)
            .then(res => res.data),

    updateAsset: (id: number | string, payload: AssetUpdatePayload): Promise<AssetDetail> =>
        (api.put(`/assets/${id}`, payload) as unknown as AR<AssetDetail>)
            .then(res => res.data),

    deleteAsset: (id: number | string): Promise<void> =>
        api.delete(`/assets/${id}`).then(() => undefined),

    assignAsset: (id: number | string, payload: AssignPayload): Promise<AssetDetail> =>
        (api.post(`/assets/${id}/assign`, payload) as unknown as AR<AssetDetail>)
            .then(res => res.data),

    returnAsset: (id: number | string, payload: ReturnPayload): Promise<AssetDetail> =>
        (api.post(`/assets/${id}/return`, payload) as unknown as AR<AssetDetail>)
            .then(res => res.data),

    getHistory: (id: number | string, params: {
        historyType?: string; page?: number; size?: number;
    }): Promise<PageResponse<AssetHistoryItem>> =>
        (api.get(`/assets/${id}/history`, { params }) as unknown as AR<PageResponse<AssetHistoryItem>>)
            .then(res => res.data),

    // Blob exports — interceptor returns response.data (= Blob) directly
    exportHistory: (id: number | string): Promise<Blob> =>
        api.get(`/assets/${id}/history/export`, { responseType: 'blob' }) as unknown as Promise<Blob>,

    exportAssets: (params: { status?: AssetStatus; type?: string; keyword?: string }): Promise<Blob> =>
        api.get('/assets/export', { params, responseType: 'blob' }) as unknown as Promise<Blob>,

    // Search employees for assign dropdown
    searchEmployees: (keyword: string, page = 0, size = 20): Promise<PageResponse<EmployeeOption>> =>
        (api.get('/employees', { params: { search: keyword, page, size } }) as unknown as AR<PageResponse<EmployeeOption>>)
            .then(res => res.data),
};