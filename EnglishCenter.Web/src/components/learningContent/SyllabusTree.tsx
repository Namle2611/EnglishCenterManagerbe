import React, { useState } from 'react';
import type { CourseSyllabusResponse, SyllabusSectionItem } from '../../types/learningContent.types';
import { LessonStatusBadge } from './LessonStatusBadge';
import { sortLessons, sortSections } from '../../utils/learningContentHelper';

interface SyllabusTreeProps {
  syllabus: CourseSyllabusResponse;
  userRole: 'ADMIN' | 'STAFF' | 'TEACHER';
  selectedSectionId: number | null;
  selectedLessonId: number | null;
  onSelectSection: (sectionId: number) => void;
  onSelectLesson: (sectionId: number, lessonId: number) => void;
  onCreateSection: () => void;
  onEditSection: (section: SyllabusSectionItem) => void;
  onDeleteSection: (section: SyllabusSectionItem) => void;
  onCreateLesson: (section: SyllabusSectionItem) => void;
}

export const SyllabusTree: React.FC<SyllabusTreeProps> = ({
  syllabus,
  userRole,
  selectedSectionId,
  selectedLessonId,
  onSelectSection,
  onSelectLesson,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  onCreateLesson
}) => {
  const isTeacher = userRole === 'TEACHER';

  // Track expanded section IDs
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    syllabus.sections.forEach((sec) => {
      init[sec.id] = true; // Expanded by default
    });
    return init;
  });

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    onSelectSection(sectionId);
  };

  const sortedSections = sortSections(syllabus.sections);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.25rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-subtle)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              {syllabus.courseCode}
            </span>
            {syllabus.level && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Trình độ: {syllabus.level}
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {syllabus.courseName}
          </h3>
        </div>

        {/* Create Section Button (Admin/Staff only) */}
        {!isTeacher && (
          <button
            type="button"
            onClick={onCreateSection}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-primary-border)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>+ Thêm chương</span>
          </button>
        )}
      </div>

      {/* Zero Sections State */}
      {sortedSections.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <span style={{ fontSize: '2rem' }} aria-hidden="true">
            📂
          </span>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '340px' }}>
            {isTeacher
              ? 'Khóa học này hiện chưa có nội dung giáo trình nào được tạo.'
              : 'Khóa học này hiện chưa có chương học nào. Hãy bắt đầu xây dựng giáo trình bằng cách tạo chương đầu tiên!'}
          </p>
          {!isTeacher && (
            <button
              type="button"
              onClick={onCreateSection}
              style={{
                marginTop: '0.25rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-primary-border)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Tạo chương đầu tiên
            </button>
          )}
        </div>
      ) : (
        /* Sections & Lessons Tree */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }} role="tree">
          {sortedSections.map((sec) => {
            const isExpanded = Boolean(expandedSections[sec.id]);
            const isSectionSelected = selectedSectionId === sec.id;
            const sortedLessons = sortLessons(sec.lessons || []);

            return (
              <div
                key={sec.id}
                style={{
                  border: isSectionSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Section Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: isSectionSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface-subtle)',
                    borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                    gap: '0.5rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`section-content-${sec.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: 1,
                      minWidth: 0,
                      color: 'inherit'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)'
                      }}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          #{sec.orderIndex}
                        </span>
                        <strong
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sec.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)'
                          }}
                        >
                          {sortedLessons.length} bài
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Section Controls (Admin/Staff only) */}
                  {!isTeacher && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => onCreateLesson(sec)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                        title="Thêm bài học vào chương này"
                      >
                        + Bài học
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditSection(sec)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer'
                        }}
                        title="Chỉnh sửa chương"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSection(sec)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--status-danger-border)',
                          backgroundColor: 'var(--status-danger-bg)',
                          color: 'var(--status-danger-text)',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                        title="Xóa chương học"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Content & Lessons */}
                {isExpanded && (
                  <div id={`section-content-${sec.id}`} style={{ padding: '0.625rem' }}>
                    {sec.description && (
                      <p
                        style={{
                          margin: '0 0 0.5rem 0',
                          padding: '0 0.5rem',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic'
                        }}
                      >
                        {sec.description}
                      </p>
                    )}

                    {sortedLessons.length === 0 ? (
                      <div
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.8125rem',
                          backgroundColor: 'var(--color-surface-subtle)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        {isTeacher ? (
                          'Chương này chưa có bài học.'
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Chương này chưa có bài học.</span>
                            <button
                              type="button"
                              onClick={() => onCreateLesson(sec)}
                              style={{
                                padding: '0.3rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              + Thêm bài học ngay
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {sortedLessons.map((les) => {
                          const isLessonSelected = selectedLessonId === les.id;

                          return (
                            <button
                              key={les.id}
                              type="button"
                              onClick={() => onSelectLesson(sec.id, les.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: isLessonSelected
                                  ? '1px solid var(--color-primary)'
                                  : '1px solid transparent',
                                backgroundColor: isLessonSelected
                                  ? 'var(--color-primary-subtle)'
                                  : 'var(--color-surface-subtle)',
                                color: isLessonSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: 'var(--color-text-muted)'
                                  }}
                                >
                                  #{les.orderIndex}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: isLessonSelected ? 600 : 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {les.title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                <LessonStatusBadge status={les.status} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
