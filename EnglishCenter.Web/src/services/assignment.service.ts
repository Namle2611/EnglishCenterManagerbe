import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  AssignmentClassLookupItem,
  AssignmentClassLookupParams,
  AssignmentDetail,
  AssignmentListItem,
  AssignmentQueryParams,
  CreateAssignmentPayload,
  CreateSubmissionPayload,
  StudentAssignmentQueryParams,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionQueryParams,
  UpdateAssignmentPayload,
  UpdateSubmissionPayload
} from '../types/assignment.types';
import { normalizeNullableString } from '../utils/assignmentHelper';

export const assignmentService = {
  /**
   * List assignments with pagination, search, and filters.
   */
  async getAssignments(
    params: AssignmentQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<AssignmentListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AssignmentListItem>>>(
      '/assignments',
      {
        params: {
          classId: params.classId || undefined,
          status: params.status || undefined,
          dueFrom: params.dueFrom || undefined,
          dueTo: params.dueTo || undefined,
          search: params.search?.trim() || undefined,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * List assignments for Student with pagination, search, and status filter (no classId).
   */
  async getStudentAssignments(
    params: StudentAssignmentQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<AssignmentListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AssignmentListItem>>>(
      '/assignments',
      {
        params: {
          status: params.status || undefined,
          search: params.search?.trim() || undefined,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * Lookup classes for assignment management (Admin/Staff/Teacher).
   */
  async getClassLookup(
    params: AssignmentClassLookupParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<AssignmentClassLookupItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AssignmentClassLookupItem>>>(
      '/assignments/lookups/classes',
      {
        params: {
          classId: params.classId || undefined,
          status: params.status || undefined,
          search: params.search?.trim() || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 20
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * Get single assignment detail by ID.
   */
  async getAssignmentById(
    id: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<AssignmentDetail>> {
    const response = await axiosClient.get<ApiResponse<AssignmentDetail>>(
      `/assignments/${id}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Create a new assignment.
   * Sends strictly authorized fields only.
   */
  async createAssignment(
    payload: CreateAssignmentPayload
  ): Promise<ApiResponse<AssignmentDetail>> {
    const strictPayload = {
      classId: payload.classId,
      title: payload.title.trim(),
      description: normalizeNullableString(payload.description),
      attachmentUrl: normalizeNullableString(payload.attachmentUrl),
      deadline: payload.deadline,
      maxScore: payload.maxScore,
      status: payload.status
    };

    const response = await axiosClient.post<ApiResponse<AssignmentDetail>>(
      '/assignments',
      strictPayload
    );
    return response.data;
  },

  /**
   * Update an existing assignment.
   * Sends strictly authorized fields only (no classId or teacherId).
   */
  async updateAssignment(
    id: number,
    payload: UpdateAssignmentPayload
  ): Promise<ApiResponse<AssignmentDetail>> {
    const strictPayload = {
      title: payload.title.trim(),
      description: normalizeNullableString(payload.description),
      attachmentUrl: normalizeNullableString(payload.attachmentUrl),
      deadline: payload.deadline,
      maxScore: payload.maxScore,
      status: payload.status
    };

    const response = await axiosClient.put<ApiResponse<AssignmentDetail>>(
      `/assignments/${id}`,
      strictPayload
    );
    return response.data;
  },

  /**
   * Delete an assignment with zero submissions.
   */
  async deleteAssignment(id: number): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete<ApiResponse<void>>(
      `/assignments/${id}`
    );
    return response.data;
  },

  /**
   * Get submissions for an assignment (Admin, Staff, Teacher).
   */
  async getSubmissions(
    assignmentId: number,
    params: SubmissionQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<SubmissionListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<SubmissionListItem>>>(
      `/assignments/${assignmentId}/submissions`,
      {
        params: {
          search: params.search?.trim() || undefined,
          studentId: params.studentId || undefined,
          isLate: params.isLate,
          isGraded: params.isGraded,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * Get authenticated student's own submission for an assignment.
   * Returns 404 if no submission exists yet.
   */
  async getMySubmission(
    assignmentId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<SubmissionDetail>> {
    const response = await axiosClient.get<ApiResponse<SubmissionDetail>>(
      `/assignments/${assignmentId}/my-submission`,
      { signal }
    );
    return response.data;
  },

  /**
   * Create authenticated student's initial submission for an assignment.
   * Strictly formatted payload.
   */
  async createSubmission(
    assignmentId: number,
    payload: CreateSubmissionPayload
  ): Promise<ApiResponse<SubmissionDetail>> {
    const strictPayload = {
      fileUrl: normalizeNullableString(payload.fileUrl),
      content: normalizeNullableString(payload.content)
    };

    const response = await axiosClient.post<ApiResponse<SubmissionDetail>>(
      `/assignments/${assignmentId}/submissions`,
      strictPayload
    );
    return response.data;
  },

  /**
   * Get submission detail by ID.
   */
  async getSubmissionById(
    id: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<SubmissionDetail>> {
    const response = await axiosClient.get<ApiResponse<SubmissionDetail>>(
      `/submissions/${id}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Resubmit / update an existing submission.
   * Strictly formatted payload.
   */
  async updateSubmission(
    id: number,
    payload: UpdateSubmissionPayload
  ): Promise<ApiResponse<SubmissionDetail>> {
    const strictPayload = {
      fileUrl: normalizeNullableString(payload.fileUrl),
      content: normalizeNullableString(payload.content)
    };

    const response = await axiosClient.put<ApiResponse<SubmissionDetail>>(
      `/submissions/${id}`,
      strictPayload
    );
    return response.data;
  }
};
