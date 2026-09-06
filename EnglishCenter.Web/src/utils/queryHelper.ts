import type { ManagementQueryParams } from '../types/common.types';

export function buildManagementQueryParams(
  params: ManagementQueryParams
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  if (params.page && params.page >= 1) {
    result.page = params.page;
  }

  if (params.pageSize && params.pageSize >= 1) {
    result.pageSize = params.pageSize;
  }

  if (params.search && params.search.trim().length > 0) {
    result.search = params.search.trim();
  }

  if (params.sortBy && params.sortBy.trim().length > 0) {
    result.sortBy = params.sortBy.trim();
  }

  if (params.sortDirection) {
    const normalizedDirection = params.sortDirection.toLowerCase();
    if (normalizedDirection === 'asc' || normalizedDirection === 'desc') {
      result.sortDirection = normalizedDirection;
    }
  }

  return result;
}
