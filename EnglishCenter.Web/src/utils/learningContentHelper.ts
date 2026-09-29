import type React from 'react';
import type { LessonStatus, SyllabusLessonItem, SyllabusSectionItem } from '../types/learningContent.types';

export const getLessonStatusLabel = (status: LessonStatus): string => {
  switch (status) {
    case 'Draft':
      return 'Bản nháp';
    case 'Published':
      return 'Đã xuất bản';
    case 'Hidden':
      return 'Đã ẩn';
    default:
      return status;
  }
};

export const getLessonStatusBadgeStyle = (status: LessonStatus): React.CSSProperties => {
  switch (status) {
    case 'Published':
      return {
        backgroundColor: '#dcfce7',
        color: '#15803d',
        border: '1px solid #bbf7d0'
      };
    case 'Hidden':
      return {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        border: '1px solid #e2e8f0'
      };
    case 'Draft':
    default:
      return {
        backgroundColor: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fde68a'
      };
  }
};

export const validateUrl = (url: string | null | undefined): { isValid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    return { isValid: true };
  }

  const trimmed = url.trim();

  if (trimmed.length > 500) {
    return { isValid: false, error: 'Đường dẫn không được vượt quá 500 ký tự.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Đường dẫn phải bắt đầu bằng http:// hoặc https://.' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Định dạng đường dẫn URL không hợp lệ.' };
  }
};

export const validatePublishedLesson = (data: {
  content?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  documentUrl?: string | null;
}): boolean => {
  const hasContent = Boolean(data.content && data.content.trim().length > 0);
  const hasVideo = Boolean(data.videoUrl && data.videoUrl.trim().length > 0);
  const hasAudio = Boolean(data.audioUrl && data.audioUrl.trim().length > 0);
  const hasDoc = Boolean(data.documentUrl && data.documentUrl.trim().length > 0);

  return hasContent || hasVideo || hasAudio || hasDoc;
};

export const sortSections = (sections: SyllabusSectionItem[]): SyllabusSectionItem[] => {
  return [...sections].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.id - b.id;
  });
};

export const sortLessons = (lessons: SyllabusLessonItem[]): SyllabusLessonItem[] => {
  return [...lessons].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.id - b.id;
  });
};

export const extractErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; errors?: string[] } } }).response;
    if (response) {
      const status = response.status;
      const data = response.data;

      // Handle specific HTTP Statuses with clear Vietnamese messaging
      if (status === 409) {
        if (data?.message?.includes('Section with title') || data?.message?.includes('already exists')) {
          return 'Tên chương đã tồn tại trong khóa học này. Vui lòng chọn tên khác.';
        }
        if (data?.message?.includes('Lesson with title') || data?.message?.includes('already exists')) {
          return 'Tên bài học đã tồn tại trong chương này. Vui lòng chọn tên khác.';
        }
        return data?.message || 'Dữ liệu bị trùng lặp, vui lòng kiểm tra lại.';
      }

      if (status === 400) {
        if (data?.message?.includes('contains') && data?.message?.includes('lessons')) {
          return 'Không thể xóa chương đang chứa bài học. Vui lòng xóa hoặc di chuyển các bài học trước.';
        }
        if (data?.message?.includes('content or at least one resource URL')) {
          return 'Bài học ở trạng thái "Đã xuất bản" phải có nội dung văn bản hoặc ít nhất một liên kết tài nguyên.';
        }
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors.join(' ');
        }
        if (data?.message) {
          return data.message;
        }
      }

      if (status === 403) {
        return 'Bạn không có quyền thực hiện thao tác này.';
      }

      if (status === 404) {
        return 'Dữ liệu yêu cầu không tồn tại hoặc đã bị xóa.';
      }

      if (data?.message) {
        return data.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
