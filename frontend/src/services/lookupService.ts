import api from '@/lib/axios';

export interface DepartmentOption {
    id: number;
    name: string;
    code: string;
}

export interface PositionOption {
    id: number;
    title: string;
    code: string;
    departmentId: number;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const lookupService = {
    getDepartments: (): Promise<DepartmentOption[]> =>
        (api.get<unknown, ApiResponse<DepartmentOption[]>>('/departments') as Promise<ApiResponse<DepartmentOption[]>>)
            .then((res) => res.data),

    getPositions: (departmentId?: number): Promise<PositionOption[]> =>
        (api.get<unknown, ApiResponse<PositionOption[]>>('/positions', {
            params: { departmentId }
        }) as Promise<ApiResponse<PositionOption[]>>)
            .then((res) => res.data),
};
