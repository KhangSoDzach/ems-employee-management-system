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

const extractPayload = <T>(res: unknown): T => {
    const maybeAxios = res as { data?: unknown };
    const firstLayer = maybeAxios?.data;

    if (firstLayer && typeof firstLayer === 'object' && 'data' in (firstLayer as Record<string, unknown>)) {
        return (firstLayer as { data: T }).data;
    }

    return (firstLayer as T) ?? (res as T);
};

const blobPayload = (res: unknown): Blob => {
    const maybeAxios = res as { data?: unknown };
    const firstLayer = maybeAxios?.data;
    return (firstLayer as Blob) ?? (res as Blob);
};

export const assetService = {
    getMyAssets: (): Promise<MyAsset[]> =>
        api.get<ApiResponse<PageResponse<MyAsset>>>('/my/assets')
            .then(res => extractPayload<PageResponse<MyAsset>>(res).content),

    submitReport: (assetId: number, data: { incidentType: string; description: string }, attachment?: File): Promise<IncidentReportDetail> => {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (attachment) {
            formData.append('attachment', attachment);
        }
        return api.post<ApiResponse<IncidentReportDetail>>(`/assets/${assetId}/report`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => extractPayload<IncidentReportDetail>(res));
    },

    getMyReports: (page = 0, size = 10): Promise<PageResponse<IncidentReportRow>> =>
        api.get<ApiResponse<PageResponse<IncidentReportRow>>>('/my/reports', { params: { page, size } })
            .then(res => extractPayload<PageResponse<IncidentReportRow>>(res)),

    getMyReportDetail: (id: number): Promise<IncidentReportDetail> =>
        api.get<ApiResponse<IncidentReportDetail>>(`/my/reports/${id}`)
            .then(res => extractPayload<IncidentReportDetail>(res)),

    // Admin/HR APIs
    getAllReports: (params: { status?: string; employeeId?: number; fromDate?: string; toDate?: string; keyword?: string; page?: number; size?: number }): Promise<PageResponse<AdminIncidentListItem>> =>
        api.get<ApiResponse<PageResponse<AdminIncidentListItem>>>('/admin/asset-reports', { params })
            .then(res => extractPayload<PageResponse<AdminIncidentListItem>>(res)),

    getAdminReportDetail: (id: number): Promise<IncidentReportDetail> =>
        api.get<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}`)
            .then(res => extractPayload<IncidentReportDetail>(res)),

    approveReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        api.post<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}/approve`, { note })
            .then(res => extractPayload<IncidentReportDetail>(res)),

    rejectReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
        api.post<ApiResponse<IncidentReportDetail>>(`/admin/asset-reports/${id}/reject`, { note })
            .then(res => extractPayload<IncidentReportDetail>(res)),

    // ─── Asset Management (HR/Admin/Manager) ──────────────────────────────────
    listAssets: (params: {
        page?: number; size?: number;
        status?: AssetStatus; type?: string; keyword?: string;
    }): Promise<PageResponse<AssetSummary>> =>
        api.get<ApiResponse<PageResponse<AssetSummary>>>('/assets', { params })
            .then(res => extractPayload<PageResponse<AssetSummary>>(res)),

    getNextCode: (): Promise<string> =>
        api.get<ApiResponse<{ nextCode: string }>>('/assets/next-code')
            .then(res => extractPayload<{ nextCode: string }>(res).nextCode),

    getAssetById: (id: number | string): Promise<AssetDetail> =>
        api.get<ApiResponse<AssetDetail>>(`/assets/${id}`)
            .then(res => extractPayload<AssetDetail>(res)),

    createAsset: (payload: AssetCreatePayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>('/assets', payload)
            .then(res => extractPayload<AssetDetail>(res)),

    updateAsset: (id: number | string, payload: AssetUpdatePayload): Promise<AssetDetail> =>
        api.put<ApiResponse<AssetDetail>>(`/assets/${id}`, payload)
            .then(res => extractPayload<AssetDetail>(res)),

    deleteAsset: (id: number | string): Promise<void> =>
        api.delete(`/assets/${id}`).then(() => undefined),

    assignAsset: (id: number | string, payload: AssignPayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>(`/assets/${id}/assign`, payload)
            .then(res => extractPayload<AssetDetail>(res)),

    returnAsset: (id: number | string, payload: ReturnPayload): Promise<AssetDetail> =>
        api.post<ApiResponse<AssetDetail>>(`/assets/${id}/return`, payload)
            .then(res => extractPayload<AssetDetail>(res)),

    getHistory: (id: number | string, params: {
        historyType?: string; page?: number; size?: number;
    }): Promise<PageResponse<AssetHistoryItem>> =>
        api.get<ApiResponse<PageResponse<AssetHistoryItem>>>(`/assets/${id}/history`, { params })
            .then(res => extractPayload<PageResponse<AssetHistoryItem>>(res)),

    exportHistory: (id: number | string): Promise<Blob> =>
        api.get(`/assets/${id}/history/export`, { responseType: 'blob' })
            .then(blobPayload),

    exportAssets: (params: { status?: AssetStatus; type?: string; keyword?: string; }): Promise<Blob> =>
        api.get('/assets/export', { params, responseType: 'blob' })
            .then(blobPayload),

    // Search employees for assign dropdown
    searchEmployees: (keyword: string, page = 0, size = 20): Promise<PageResponse<EmployeeOption>> =>
        api.get<ApiResponse<PageResponse<EmployeeOption>>>('/employees', {
            params: { search: keyword, page, size },
        }).then(res => extractPayload<PageResponse<EmployeeOption>>(res)),
};