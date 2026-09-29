import type { PaginationParams } from './common.types';

export type LessonStatus = 'Draft' | 'Published' | 'Hidden';

export interface TeacherCourseLookupItem {
  courseId: number;
  courseCode: string;
  courseName: string;
  level?: string | null;
}

export interface TeacherCourseLookupParams extends PaginationParams {
  search?: string;
}

export interface SyllabusLessonItem {
  id: number;
  title: string;
  content: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  documentUrl: string | null;
  orderIndex: number;
  status: LessonStatus;
}

export interface SyllabusSectionItem {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: SyllabusLessonItem[];
}

export interface CourseSyllabusResponse {
  courseId: number;
  courseCode: string;
  courseName: string;
  level: string | null;
  sections: SyllabusSectionItem[];
}

export interface SectionListItem {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessonCount: number;
}

export interface SectionDetail {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessonCount: number;
}

export interface SectionQueryParams extends PaginationParams {
  courseId?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateSectionPayload {
  courseId: number;
  title: string;
  description?: string | null;
  orderIndex?: number | null;
}

export interface UpdateSectionPayload {
  title: string;
  description?: string | null;
  orderIndex: number;
}

export interface LessonListItem {
  id: number;
  sectionId: number;
  sectionTitle: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  title: string;
  orderIndex: number;
  status: LessonStatus;
  hasContent: boolean;
  hasVideoUrl: boolean;
  hasAudioUrl: boolean;
  hasDocumentUrl: boolean;
}

export interface LessonDetail {
  id: number;
  sectionId: number;
  sectionTitle: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  documentUrl: string | null;
  orderIndex: number;
  status: LessonStatus;
}

export interface LessonQueryParams extends PaginationParams {
  sectionId?: number;
  courseId?: number;
  status?: LessonStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateLessonPayload {
  sectionId: number;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  documentUrl?: string | null;
  orderIndex?: number | null;
  status?: LessonStatus | null;
}

export interface UpdateLessonPayload {
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  documentUrl?: string | null;
  orderIndex: number;
  status: LessonStatus;
}

export interface UpdateLessonStatusPayload {
  status: LessonStatus;
}

export interface CourseSelectorItem {
  id: number;
  code: string;
  name: string;
  level?: string | null;
}
