import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type { CourseListItem } from '../types/course.types';
import type {
  CourseSyllabusResponse,
  CreateLessonPayload,
  CreateSectionPayload,
  LessonDetail,
  LessonListItem,
  LessonQueryParams,
  SectionDetail,
  SectionListItem,
  SectionQueryParams,
  TeacherCourseLookupItem,
  TeacherCourseLookupParams,
  UpdateLessonPayload,
  UpdateLessonStatusPayload,
  UpdateSectionPayload
} from '../types/learningContent.types';

export const learningContentService = {
  // Course Discovery
  async getTeacherCoursesLookup(
    params: TeacherCourseLookupParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<TeacherCourseLookupItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<TeacherCourseLookupItem>>>(
      '/sections/lookups/courses',
      {
        params: {
          search: params.search?.trim() || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 20
        },
        signal
      }
    );
    return response.data;
  },

  async getAdminStaffCourses(
    params: { search?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<CourseListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<CourseListItem>>>('/courses', {
      params: {
        search: params.search?.trim() || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        sortBy: 'courseName',
        sortDirection: 'asc'
      },
      signal
    });
    return response.data;
  },

  // Syllabus Workspace
  async getCourseSyllabus(
    courseId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<CourseSyllabusResponse>> {
    const response = await axiosClient.get<ApiResponse<CourseSyllabusResponse>>(
      `/sections/course/${courseId}`,
      { signal }
    );
    return response.data;
  },

  // Section Operations
  async getSections(
    params: SectionQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<SectionListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<SectionListItem>>>('/sections', {
      params,
      signal
    });
    return response.data;
  },

  async getSectionById(id: number, signal?: AbortSignal): Promise<ApiResponse<SectionDetail>> {
    const response = await axiosClient.get<ApiResponse<SectionDetail>>(`/sections/${id}`, { signal });
    return response.data;
  },

  async createSection(payload: CreateSectionPayload): Promise<ApiResponse<SectionDetail>> {
    // Strictly format payload with only approved properties
    const requestBody: {
      courseId: number;
      title: string;
      description?: string | null;
      orderIndex?: number | null;
    } = {
      courseId: payload.courseId,
      title: payload.title.trim(),
      description: payload.description?.trim() ? payload.description.trim() : null,
      orderIndex: typeof payload.orderIndex === 'number' ? payload.orderIndex : null
    };

    const response = await axiosClient.post<ApiResponse<SectionDetail>>('/sections', requestBody);
    return response.data;
  },

  async updateSection(
    id: number,
    payload: UpdateSectionPayload
  ): Promise<ApiResponse<SectionDetail>> {
    // Strictly format payload: NEVER send courseId or id
    const requestBody: {
      title: string;
      description?: string | null;
      orderIndex: number;
    } = {
      title: payload.title.trim(),
      description: payload.description?.trim() ? payload.description.trim() : null,
      orderIndex: payload.orderIndex
    };

    const response = await axiosClient.put<ApiResponse<SectionDetail>>(`/sections/${id}`, requestBody);
    return response.data;
  },

  async deleteSection(id: number): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete<ApiResponse<void>>(`/sections/${id}`);
    return response.data;
  },

  // Lesson Operations
  async getLessons(
    params: LessonQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<LessonListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<LessonListItem>>>('/lessons', {
      params,
      signal
    });
    return response.data;
  },

  async getLessonById(id: number, signal?: AbortSignal): Promise<ApiResponse<LessonDetail>> {
    const response = await axiosClient.get<ApiResponse<LessonDetail>>(`/lessons/${id}`, { signal });
    return response.data;
  },

  async createLesson(payload: CreateLessonPayload): Promise<ApiResponse<LessonDetail>> {
    // Strictly format payload with only approved properties
    const requestBody: {
      sectionId: number;
      title: string;
      content?: string | null;
      videoUrl?: string | null;
      audioUrl?: string | null;
      documentUrl?: string | null;
      orderIndex?: number | null;
      status?: string | null;
    } = {
      sectionId: payload.sectionId,
      title: payload.title.trim(),
      content: payload.content?.trim() ? payload.content.trim() : null,
      videoUrl: payload.videoUrl?.trim() ? payload.videoUrl.trim() : null,
      audioUrl: payload.audioUrl?.trim() ? payload.audioUrl.trim() : null,
      documentUrl: payload.documentUrl?.trim() ? payload.documentUrl.trim() : null,
      orderIndex: typeof payload.orderIndex === 'number' ? payload.orderIndex : null
    };

    if (payload.status) {
      requestBody.status = payload.status;
    }

    const response = await axiosClient.post<ApiResponse<LessonDetail>>('/lessons', requestBody);
    return response.data;
  },

  async updateLesson(id: number, payload: UpdateLessonPayload): Promise<ApiResponse<LessonDetail>> {
    // Strictly format payload: NEVER send sectionId or id
    const requestBody: {
      title: string;
      content?: string | null;
      videoUrl?: string | null;
      audioUrl?: string | null;
      documentUrl?: string | null;
      orderIndex: number;
      status: string;
    } = {
      title: payload.title.trim(),
      content: payload.content?.trim() ? payload.content.trim() : null,
      videoUrl: payload.videoUrl?.trim() ? payload.videoUrl.trim() : null,
      audioUrl: payload.audioUrl?.trim() ? payload.audioUrl.trim() : null,
      documentUrl: payload.documentUrl?.trim() ? payload.documentUrl.trim() : null,
      orderIndex: payload.orderIndex,
      status: payload.status
    };

    const response = await axiosClient.put<ApiResponse<LessonDetail>>(`/lessons/${id}`, requestBody);
    return response.data;
  },

  async patchLessonStatus(
    id: number,
    status: UpdateLessonStatusPayload['status']
  ): Promise<ApiResponse<LessonDetail>> {
    const requestBody: UpdateLessonStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<LessonDetail>>(
      `/lessons/${id}/status`,
      requestBody
    );
    return response.data;
  },

  async deleteLesson(id: number): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete<ApiResponse<void>>(`/lessons/${id}`);
    return response.data;
  }
};
