import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { CourseSelector } from '../../components/learningContent/CourseSelector';
import { SyllabusTree } from '../../components/learningContent/SyllabusTree';
import { LessonViewer } from '../../components/learningContent/LessonViewer';
import { SectionModal } from '../../components/learningContent/SectionModal';
import { LessonEditorModal } from '../../components/learningContent/LessonEditorModal';
import { DeleteConfirmModal } from '../../components/learningContent/DeleteConfirmModal';
import type {
  CourseSelectorItem,
  CourseSyllabusResponse,
  LessonStatus,
  SyllabusLessonItem,
  SyllabusSectionItem
} from '../../types/learningContent.types';
import { learningContentService } from '../../services/learningContent.service';
import { extractErrorMessage } from '../../utils/learningContentHelper';

export const LearningContentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { courseId: paramCourseId, sectionId: paramSectionId, lessonId: paramLessonId } = useParams<{
    courseId?: string;
    sectionId?: string;
    lessonId?: string;
  }>();

  // Safely parse canonical path identifiers
  const parsedCourseId = paramCourseId && !isNaN(Number(paramCourseId)) && Number(paramCourseId) > 0
    ? Number(paramCourseId)
    : null;
  const parsedSectionId = paramSectionId && !isNaN(Number(paramSectionId)) && Number(paramSectionId) > 0
    ? Number(paramSectionId)
    : null;
  const parsedLessonId = paramLessonId && !isNaN(Number(paramLessonId)) && Number(paramLessonId) > 0
    ? Number(paramLessonId)
    : null;

  // Determine current active namespace from path
  const currentRoleNamespace = location.pathname.startsWith('/admin')
    ? 'ADMIN'
    : location.pathname.startsWith('/staff')
    ? 'STAFF'
    : 'TEACHER';

  const routePrefix = `/${currentRoleNamespace.toLowerCase()}/learning-content`;

  // Syllabus state
  const [syllabus, setSyllabus] = useState<CourseSyllabusResponse | null>(null);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  // Modals state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState<SyllabusSectionItem | null>(null);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeEditLesson, setActiveEditLesson] = useState<SyllabusLessonItem | null>(null);
  const [activeLessonSection, setActiveLessonSection] = useState<{ id: number; title: string } | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemType: 'section' | 'lesson';
    itemId: number;
    itemTitle: string;
    isBlocked?: boolean;
    blockReason?: string;
  }>({
    isOpen: false,
    itemType: 'section',
    itemId: 0,
    itemTitle: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusPatching, setIsStatusPatching] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch Syllabus with AbortController for stale request cancellation
  const fetchSyllabus = useCallback(async (cId: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingSyllabus(true);
    setSyllabusError(null);

    try {
      const res = await learningContentService.getCourseSyllabus(cId, controller.signal);
      if (res.success && res.data) {
        setSyllabus(res.data);
      } else {
        setSyllabusError(res.message || 'Không thể tải giáo trình khóa học.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
        return;
      }
      const msg = extractErrorMessage(err, 'Lỗi khi tải nội dung giáo trình.');
      setSyllabusError(msg);
      setSyllabus(null);
    } finally {
      setIsLoadingSyllabus(false);
    }
  }, []);

  // When canonical courseId in URL changes, load syllabus
  useEffect(() => {
    const timer = setTimeout(() => {
      if (parsedCourseId) {
        void fetchSyllabus(parsedCourseId);
      } else {
        setSyllabus(null);
        setSyllabusError(null);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [parsedCourseId, fetchSyllabus]);

  // Find currently selected lesson
  let selectedLesson: SyllabusLessonItem | null = null;
  if (syllabus && parsedSectionId && parsedLessonId) {
    const sec = syllabus.sections.find((s) => s.id === parsedSectionId);
    if (sec) {
      selectedLesson = sec.lessons.find((l) => l.id === parsedLessonId) || null;
    }
  }

  // Navigation handlers
  const handleSelectCourse = (course: CourseSelectorItem) => {
    navigate(`${routePrefix}/courses/${course.id}`);
  };

  const handleSelectSection = (sectionId: number) => {
    if (parsedCourseId) {
      navigate(`${routePrefix}/courses/${parsedCourseId}/sections/${sectionId}`);
    }
  };

  const handleSelectLesson = (sectionId: number, lessonId: number) => {
    if (parsedCourseId) {
      navigate(`${routePrefix}/courses/${parsedCourseId}/sections/${sectionId}/lessons/${lessonId}`);
    }
  };

  // Section CRUD Actions
  const handleOpenCreateSection = () => {
    setActiveEditSection(null);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section: SyllabusSectionItem) => {
    setActiveEditSection(section);
    setIsSectionModalOpen(true);
  };

  const handleOpenDeleteSection = (section: SyllabusSectionItem) => {
    const hasLessons = Boolean(section.lessons && section.lessons.length > 0);
    setDeleteModalState({
      isOpen: true,
      itemType: 'section',
      itemId: section.id,
      itemTitle: section.title,
      isBlocked: hasLessons,
      blockReason: hasLessons
        ? `Chương này đang chứa ${section.lessons.length} bài học. Hệ thống không cho phép xóa chương khi còn bài học.`
        : undefined
    });
  };

  // Lesson CRUD Actions
  const handleOpenCreateLesson = (section: SyllabusSectionItem) => {
    setActiveEditLesson(null);
    setActiveLessonSection({ id: section.id, title: section.title });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = () => {
    if (selectedLesson && parsedSectionId && syllabus) {
      const sec = syllabus.sections.find((s) => s.id === parsedSectionId);
      setActiveEditLesson(selectedLesson);
      setActiveLessonSection({ id: parsedSectionId, title: sec ? sec.title : '' });
      setIsLessonModalOpen(true);
    }
  };

  const handleOpenDeleteLesson = () => {
    if (selectedLesson) {
      setDeleteModalState({
        isOpen: true,
        itemType: 'lesson',
        itemId: selectedLesson.id,
        itemTitle: selectedLesson.title,
        isBlocked: false
      });
    }
  };

  // Delete confirmation executor
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      if (deleteModalState.itemType === 'section') {
        const res = await learningContentService.deleteSection(deleteModalState.itemId);
        if (res.success) {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (parsedCourseId) {
            await fetchSyllabus(parsedCourseId);
            navigate(`${routePrefix}/courses/${parsedCourseId}`);
          }
        }
      } else {
        const res = await learningContentService.deleteLesson(deleteModalState.itemId);
        if (res.success) {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (parsedCourseId && parsedSectionId) {
            await fetchSyllabus(parsedCourseId);
            navigate(`${routePrefix}/courses/${parsedCourseId}/sections/${parsedSectionId}`);
          }
        }
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Xóa dữ liệu không thành công.');
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Status PATCH executor
  const handleQuickStatusChange = async (newStatus: LessonStatus) => {
    if (!selectedLesson || isStatusPatching) return;
    setIsStatusPatching(true);

    try {
      const res = await learningContentService.patchLessonStatus(selectedLesson.id, newStatus);
      if (res.success && parsedCourseId) {
        await fetchSyllabus(parsedCourseId);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Không thể cập nhật trạng thái bài học.');
      alert(msg);
    } finally {
      setIsStatusPatching(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản lý nội dung học tập"
        subtitle={
          currentRoleNamespace === 'TEACHER'
            ? `Tra cứu giáo trình, chương trình và tài liệu bài giảng các khóa học được phân công.`
            : `Xây dựng khung giáo trình, quản lý chương mục và tài nguyên bài học của trung tâm.`
        }
      />

      <div
        className="learning-content-workspace"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Course Selector & Syllabus Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          <CourseSelector
            userRole={currentRoleNamespace}
            selectedCourseId={parsedCourseId}
            onSelectCourse={handleSelectCourse}
          />

          {parsedCourseId && (
            <div>
              {isLoadingSyllabus ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.875rem'
                  }}
                >
                  Đang tải nội dung giáo trình...
                </div>
              ) : syllabusError ? (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-xl)',
                    fontSize: '0.875rem'
                  }}
                  role="alert"
                >
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Lỗi truy cập giáo trình:</strong>
                  {syllabusError}
                </div>
              ) : syllabus ? (
                <SyllabusTree
                  syllabus={syllabus}
                  userRole={currentRoleNamespace}
                  selectedSectionId={parsedSectionId}
                  selectedLessonId={parsedLessonId}
                  onSelectSection={handleSelectSection}
                  onSelectLesson={handleSelectLesson}
                  onCreateSection={handleOpenCreateSection}
                  onEditSection={handleOpenEditSection}
                  onDeleteSection={handleOpenDeleteSection}
                  onCreateLesson={handleOpenCreateLesson}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Right Column: Lesson Viewer / Workspace */}
        <div style={{ minWidth: 0 }}>
          <LessonViewer
            lesson={selectedLesson}
            userRole={currentRoleNamespace}
            onEdit={handleOpenEditLesson}
            onDelete={handleOpenDeleteLesson}
            onStatusChange={handleQuickStatusChange}
            isStatusPatching={isStatusPatching}
          />
        </div>
      </div>

      {/* Section Modal (Create / Edit) */}
      {parsedCourseId && isSectionModalOpen && (
        <SectionModal
          key={`${activeEditSection?.id || 'new'}`}
          isOpen={isSectionModalOpen}
          courseId={parsedCourseId}
          section={activeEditSection}
          onClose={() => setIsSectionModalOpen(false)}
          onSuccess={async () => {
            setIsSectionModalOpen(false);
            if (parsedCourseId) {
              await fetchSyllabus(parsedCourseId);
            }
          }}
        />
      )}

      {/* Lesson Editor Modal (Create / Edit) */}
      {activeLessonSection && isLessonModalOpen && (
        <LessonEditorModal
          key={`${activeEditLesson?.id || 'new'}`}
          isOpen={isLessonModalOpen}
          sectionId={activeLessonSection.id}
          sectionTitle={activeLessonSection.title}
          lesson={activeEditLesson}
          onClose={() => setIsLessonModalOpen(false)}
          onSuccess={async () => {
            setIsLessonModalOpen(false);
            if (parsedCourseId) {
              await fetchSyllabus(parsedCourseId);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        itemType={deleteModalState.itemType}
        itemTitle={deleteModalState.itemTitle}
        isBlocked={deleteModalState.isBlocked}
        blockReason={deleteModalState.blockReason}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </AppShell>
  );
};
export default LearningContentPage;
