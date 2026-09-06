export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ManagementQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UserSummary {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: string[];
}
