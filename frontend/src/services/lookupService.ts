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
    level: number; // 1=junior, 2=senior, 3=manager, 4=admin
}

export interface ManagerOption {
    id: number;      // employee id
    name: string;    // full name
    position: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const MANAGER_LEVEL = 3; // positions with level >= 3 are considered manager roles

export const lookupService = {
    getDepartments: (): Promise<DepartmentOption[]> =>
        (api.get<unknown, ApiResponse<DepartmentOption[]>>('/departments') as Promise<ApiResponse<DepartmentOption[]>>)
            .then((res) => res.data),

    getPositions: (departmentId?: number): Promise<PositionOption[]> =>
        (api.get<unknown, ApiResponse<PositionOption[]>>('/positions', {
            params: { departmentId }
        }) as Promise<ApiResponse<PositionOption[]>>)
            .then((res) => res.data),

    getManagers: (): Promise<ManagerOption[]> =>
        (api.get<unknown, ApiResponse<ManagerOption[]>>('/employees/managers') as Promise<ApiResponse<ManagerOption[]>>)
            .then((res) => res.data),
};
