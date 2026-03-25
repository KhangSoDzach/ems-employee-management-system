import api from "@/lib/axios";

export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "RETIRED";
export type AssetCondition = "NEW" | "GOOD" | "DAMAGED" | "LOST" | "DISPOSED";

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: "Sẵn dùng",
  ASSIGNED: "Đang cấp phát",
  RETIRED: "Đã thu hồi",
};
export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  RETIRED: "bg-yellow-100 text-yellow-700",
};
export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  NEW: "Mới",
  GOOD: "Tốt",
  DAMAGED: "Hư hỏng",
  LOST: "Thất lạc",
  DISPOSED: "Thanh lý",
};

export interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
  department: string | null;
  position: string | null;
  avatarUrl: string | null;
}
export interface AssetSummary {
  dbId: number;
  id: string;
  name: string;
  desc: string | null;
  type: string | null;
  status: string;
  statusColor: string;
  user: string | null;
}
export interface AssetDetail {
  id: number;
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
// --- ASSET REQUEST MODELS ---
export interface AssetRequestSubmit {
  assetType: string;
  reason: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface AssetRequestRow {
  id: number;
  requestId: string;
  assetType: string;
  priority: string;
  priorityLabel: string;
  priorityColor: string;
  dateRequested: string;
  status: string;
  statusLabel: string;
  statusColor: string;
}

export interface AssetRequestDetail {
  id: number;
  requestId: string;
  assetType: string;
  priority: string;
  priorityLabel: string;
  priorityColor: string;
  reason: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  requesterUserId?: number;
}

export interface AssetRequestAdminItem {
  id: number;
  requestId: string;
  employeeName: string;
  assetType: string;
  priority: string;
  priorityLabel: string;
  priorityColor: string;
  requestedAt: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  requesterUserId?: number;
}

export interface AssetRequestProcess {
  note?: string;
}

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
  requesterUserId?: number;
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
  requesterUserId?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Cast to correct return type after interceptor has already unwrapped response.data */
function wrap<R>(p: unknown): Promise<R> {
  return p as Promise<R>;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const assetService = {
  // Employee APIs
  getMyAssets: (): Promise<MyAsset[]> =>
    wrap<ApiResponse<PageResponse<MyAsset>>>(api.get("/my/assets")).then(
      (res) => res.data.content,
    ),

  submitReport: (
    assetId: number,
    data: { incidentType: string; description: string },
    attachment?: File,
  ): Promise<IncidentReportDetail> => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );
    if (attachment) {
      formData.append("attachment", attachment);
    }
    return wrap<ApiResponse<IncidentReportDetail>>(
      api.post(`/assets/${assetId}/report`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ).then((res) => res.data);
  },

  getMyReports: (
    page = 0,
    size = 10,
  ): Promise<PageResponse<IncidentReportRow>> =>
    wrap<ApiResponse<PageResponse<IncidentReportRow>>>(
      api.get("/my/reports", { params: { page, size } }),
    ).then((res) => res.data),

  getMyReportDetail: (id: number): Promise<IncidentReportDetail> =>
    wrap<ApiResponse<IncidentReportDetail>>(api.get(`/my/reports/${id}`)).then(
      (res) => res.data,
    ),

  // Admin / HR APIs
  getAllReports: (params: {
    status?: string;
    employeeId?: number;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdminIncidentListItem>> =>
    wrap<ApiResponse<PageResponse<AdminIncidentListItem>>>(
      api.get("/admin/asset-reports", { params }),
    ).then((res) => res.data),

  getAdminReportDetail: (id: number): Promise<IncidentReportDetail> =>
    wrap<ApiResponse<IncidentReportDetail>>(
      api.get(`/admin/asset-reports/${id}`),
    ).then((res) => res.data),

  approveReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
    wrap<ApiResponse<IncidentReportDetail>>(
      api.post(`/admin/asset-reports/${id}/approve`, { note }),
    ).then((res) => res.data),

  rejectReport: (id: number, note?: string): Promise<IncidentReportDetail> =>
    wrap<ApiResponse<IncidentReportDetail>>(
      api.post(`/admin/asset-reports/${id}/reject`, { note }),
    ).then((res) => res.data),

  // Asset Management
  listAssets: (
    params: {
      page?: number;
      size?: number;
      status?: AssetStatus;
      type?: string;
      keyword?: string;
    },
    signal?: AbortSignal,
  ): Promise<PageResponse<AssetSummary>> =>
    wrap<ApiResponse<PageResponse<AssetSummary>>>(
      api.get("/assets", { params, signal }),
    ).then((res) => res.data),

  getNextCode: (): Promise<string> =>
    wrap<ApiResponse<{ nextCode: string }>>(api.get("/assets/next-code")).then(
      (res) => res.data.nextCode,
    ),

  getAssetById: (id: number | string): Promise<AssetDetail> =>
    wrap<ApiResponse<AssetDetail>>(api.get(`/assets/${id}`)).then(
      (res) => res.data,
    ),

  createAsset: (payload: AssetCreatePayload): Promise<AssetDetail> =>
    wrap<ApiResponse<AssetDetail>>(api.post("/assets", payload)).then(
      (res) => res.data,
    ),

  updateAsset: (
    id: number | string,
    payload: AssetUpdatePayload,
  ): Promise<AssetDetail> =>
    wrap<ApiResponse<AssetDetail>>(api.put(`/assets/${id}`, payload)).then(
      (res) => res.data,
    ),

  deleteAsset: (id: number | string): Promise<void> =>
    api.delete(`/assets/${id}`).then(() => undefined),

  assignAsset: (
    id: number | string,
    payload: AssignPayload,
  ): Promise<AssetDetail> =>
    wrap<ApiResponse<AssetDetail>>(
      api.post(`/assets/${id}/assign`, payload),
    ).then((res) => res.data),

  returnAsset: (
    id: number | string,
    payload: ReturnPayload,
  ): Promise<AssetDetail> =>
    wrap<ApiResponse<AssetDetail>>(
      api.post(`/assets/${id}/return`, payload),
    ).then((res) => res.data),

  getHistory: (
    id: number | string,
    params: { historyType?: string; page?: number; size?: number },
  ): Promise<PageResponse<AssetHistoryItem>> =>
    wrap<ApiResponse<PageResponse<AssetHistoryItem>>>(
      api.get(`/assets/${id}/history`, { params }),
    ).then((res) => res.data),

  exportHistory: (id: number | string): Promise<Blob> =>
    api
      .get(`/assets/${id}/history/export`, { responseType: "blob" })
      .then((res) => (res as unknown as { data: Blob }).data),

  exportAssets: (params: {
    status?: AssetStatus;
    type?: string;
    keyword?: string;
  }): Promise<Blob> =>
    api
      .get("/assets/export", { params, responseType: "blob" })
      .then((res) => (res as unknown as { data: Blob }).data),

  searchEmployees: (
    keyword: string,
    page = 0,
    size = 20,
  ): Promise<PageResponse<EmployeeOption>> =>
    wrap<ApiResponse<PageResponse<EmployeeOption>>>(
      api.get("/employees", { params: { search: keyword, page, size } }),
    ).then((res) => res.data),
  // --- ASSET REQUEST ENDPOINTS (EMPLOYEE) ---

  async submitAssetRequest(
    data: AssetRequestSubmit,
  ): Promise<AssetRequestDetail> {
    const response = await api.post("/my/asset-requests", data);
    return response.data;
  },

  async getMyAssetRequests(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: AssetRequestRow[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await api.get("/my/asset-requests", {
      params: { page, size },
    });
    return response.data;
  },

  async getMyAssetRequestDetail(id: number): Promise<AssetRequestDetail> {
    const response = await api.get(`/my/asset-requests/${id}`);
    return response.data;
  },

  async cancelAssetRequest(id: number): Promise<AssetRequestDetail> {
    const response = await api.post(`/my/asset-requests/${id}/cancel`);
    return response.data;
  },

  // --- ASSET REQUEST ENDPOINTS (ADMIN/HR) ---

  async getAllAssetRequests(
    params: {
      status?: string;
      employeeId?: number;
      fromDate?: string;
      toDate?: string;
      keyword?: string;
      page?: number;
      size?: number;
    } = {},
  ): Promise<{
    content: AssetRequestAdminItem[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await api.get("/admin/asset-requests", { params });
    return response.data;
  },

  async getAssetRequestDetailAdmin(id: number): Promise<AssetRequestDetail> {
    const response = await api.get(`/admin/asset-requests/${id}`);
    return response.data;
  },

  async approveAssetRequest(
    id: number,
    data?: AssetRequestProcess,
  ): Promise<AssetRequestDetail> {
    const response = await api.post(
      `/admin/asset-requests/${id}/approve`,
      data || {},
    );
    return response.data;
  },

  async rejectAssetRequest(
    id: number,
    data?: AssetRequestProcess,
  ): Promise<AssetRequestDetail> {
    const response = await api.post(
      `/admin/asset-requests/${id}/reject`,
      data || {},
    );
    return response.data;
  },
};
