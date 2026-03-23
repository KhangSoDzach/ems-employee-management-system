import api from "@/lib/axios";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(response: ApiResponse<T>) => response.data;

export interface OfficeConfigResponse {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt?: string;
  updatedBy?: string;
  source?: string;
}

export interface OfficeConfigRequest {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface OfficeLocationResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
  isActive: boolean;
}

export interface OfficeLocationUpsertRequest {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
  isActive?: boolean;
}

export interface PositionLocationMappingResponse {
  positionId: number;
  positionCode: string;
  positionTitle: string;
  departmentId: number | null;
  officeLocationId: number | null;
  officeLocationName: string | null;
  officeLocationActive: boolean | null;
}

export interface PositionLocationMappingRequest {
  officeLocationId: number;
}

export const officeLocationService = {
  getOfficeConfig: (): Promise<OfficeConfigResponse> =>
    (
      api.get<unknown, ApiResponse<OfficeConfigResponse>>(
        "/admin/config/office-location",
      ) as Promise<ApiResponse<OfficeConfigResponse>>
    ).then(unwrap),

  updateOfficeConfig: (
    payload: OfficeConfigRequest,
  ): Promise<OfficeConfigResponse> =>
    (
      api.put<unknown, ApiResponse<OfficeConfigResponse>>(
        "/admin/config/office-location",
        payload,
      ) as Promise<ApiResponse<OfficeConfigResponse>>
    ).then(unwrap),

  getOfficeLocations: (): Promise<OfficeLocationResponse[]> =>
    (
      api.get<unknown, ApiResponse<OfficeLocationResponse[]>>(
        "/admin/office-locations",
      ) as Promise<ApiResponse<OfficeLocationResponse[]>>
    ).then(unwrap),

  createOfficeLocation: (
    payload: OfficeLocationUpsertRequest,
  ): Promise<OfficeLocationResponse> =>
    (
      api.post<unknown, ApiResponse<OfficeLocationResponse>>(
        "/admin/office-locations",
        payload,
      ) as Promise<ApiResponse<OfficeLocationResponse>>
    ).then(unwrap),

  deleteOfficeLocation: (id: number): Promise<void> =>
    (
      api.delete<unknown, ApiResponse<null>>(
        `/admin/office-locations/${id}`,
      ) as Promise<ApiResponse<null>>
    ).then(() => undefined),

  getPositionMappings: (): Promise<PositionLocationMappingResponse[]> =>
    (
      api.get<unknown, ApiResponse<PositionLocationMappingResponse[]>>(
        "/admin/office-locations/position-mappings",
      ) as Promise<ApiResponse<PositionLocationMappingResponse[]>>
    ).then(unwrap),

  updatePositionMapping: (
    positionId: number,
    payload: PositionLocationMappingRequest,
  ): Promise<PositionLocationMappingResponse> =>
    (
      api.put<unknown, ApiResponse<PositionLocationMappingResponse>>(
        `/admin/office-locations/position-mappings/${positionId}`,
        payload,
      ) as Promise<ApiResponse<PositionLocationMappingResponse>>
    ).then(unwrap),
};
