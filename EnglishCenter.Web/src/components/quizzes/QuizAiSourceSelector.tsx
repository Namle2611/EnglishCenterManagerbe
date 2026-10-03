import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { learningContentService } from '../../services/learningContent.service';
import type { QuizAiSourceType } from '../../types/quiz.types';
import { buildLessonLookupParams, mapLessonOptions, type MappedLessonOption } from '../../utils/quizAiHelper';

export interface QuizAiSourceSelectorProps {
  sourceType: QuizAiSourceType;
  onSourceTypeChange: (type: QuizAiSourceType) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  selectedLessonId: number | null;
  onLessonSelect: (lessonId: number | null, lessonTitle?: string) => void;
  quizCourseId: number;
  disabled?: boolean;
}

export const QuizAiSourceSelector: React.FC<QuizAiSourceSelectorProps> = ({
  sourceType,
  onSourceTypeChange,
  topic,
  onTopicChange,
  selectedLessonId,
  onLessonSelect,
  quizCourseId,
  disabled = false
}) => {
  const [lessonSearch, setLessonSearch] = useState('');
  const [lessons, setLessons] = useState<MappedLessonOption[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonLookupError, setLessonLookupError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch lessons when in Lesson mode or when search query changes
  useEffect(() => {
    if (sourceType !== 'Lesson') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Abort previous in-flight request so latest-wins
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      void Promise.resolve().then(() => {
        setIsLoadingLessons(true);
        setLessonLookupError(null);
      });

      const params = buildLessonLookupParams(quizCourseId, lessonSearch, 1, 20);

      learningContentService
        .getLessons(params, controller.signal)
        .then((res) => {
          if (res.success && res.data) {
            const mapped = mapLessonOptions(res.data.items);
            setLessons(mapped);
          } else {
            setLessons([]);
          }
        })
        .catch((err: unknown) => {
          if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
            // Cancelled lookup is silent: no error toast or state corruption
            return;
          }
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 403) {
              setLessonLookupError('Bạn không có quyền truy cập danh sách bài học của khóa học này.');
            } else if (err.response?.status === 404) {
              setLessonLookupError('Không tìm thấy dữ liệu khóa học hoặc bài học.');
            } else {
              setLessonLookupError('Không thể tải danh sách bài học. Vui lòng thử lại hoặc chọn tạo theo chủ đề.');
            }
          } else {
            setLessonLookupError('Lỗi tải danh mục bài học.');
          }
          setLessons([]);
        })
        .finally(() => {
          setIsLoadingLessons(false);
        });
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sourceType, quizCourseId, lessonSearch]);

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Source Type Selector */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem'
          }}
        >
          Nguồn tài liệu tạo câu hỏi <span style={{ color: 'var(--status-danger-text)' }}>*</span>
        </label>
        <div
          role="radiogroup"
          aria-label="Nguồn tài liệu tạo câu hỏi"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}
        >
          {/* Option Topic */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${
                sourceType === 'Topic' ? 'var(--color-primary)' : 'var(--color-border)'
              }`,
              backgroundColor:
                sourceType === 'Topic' ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="radio"
              name="sourceType"
              value="Topic"
              checked={sourceType === 'Topic'}
              onChange={() => onSourceTypeChange('Topic')}
              disabled={disabled}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--color-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                Chủ đề tự do
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Nhập chủ đề kiến thức tùy chọn
              </div>
            </div>
          </label>

          {/* Option Lesson */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${
                sourceType === 'Lesson' ? 'var(--color-primary)' : 'var(--color-border)'
              }`,
              backgroundColor:
                sourceType === 'Lesson' ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="radio"
              name="sourceType"
              value="Lesson"
              checked={sourceType === 'Lesson'}
              onChange={() => onSourceTypeChange('Lesson')}
              disabled={disabled}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--color-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                Bài học trong khóa
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Dựa trên giáo trình bài học
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* TOPIC MODE */}
      {sourceType === 'Topic' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.375rem'
            }}
          >
            <label
              htmlFor="ai-quiz-topic-input"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              Chủ đề kiến thức <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                color: topic.length > 300 ? 'var(--status-danger-text)' : 'var(--color-text-muted)'
              }}
            >
              {topic.length}/300 ký tự
            </span>
          </div>
          <input
            id="ai-quiz-topic-input"
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value.slice(0, 300))}
            placeholder="Ví dụ: Thì hiện tại hoàn thành (Present Perfect), Từ vựng nghề nghiệp..."
            disabled={disabled}
            maxLength={300}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: disabled ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              minHeight: '44px'
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Nêu rõ chủ điểm ngữ pháp hoặc từ vựng muốn kiểm tra (tối đa 300 ký tự).
          </div>
        </div>
      )}

      {/* LESSON MODE */}
      {sourceType === 'Lesson' && (
        <div>
          <label
            htmlFor="ai-quiz-lesson-search"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Chọn bài học trong giáo trình <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>

          {/* Lesson Search */}
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              id="ai-quiz-lesson-search"
              type="text"
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
              placeholder="Tìm kiếm bài học theo tiêu đề..."
              disabled={disabled || isLoadingLessons}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                minHeight: '40px'
              }}
            />
          </div>

          {/* Lesson Error Message */}
          {lessonLookupError && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '0.5rem',
                border: '1px solid var(--status-danger-border)'
              }}
            >
              {lessonLookupError}
            </div>
          )}

          {/* Lessons List Container */}
          <div
            role="listbox"
            aria-label="Danh sách bài học"
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {isLoadingLessons ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.875rem'
                }}
              >
                Đang tìm kiếm bài học...
              </div>
            ) : lessons.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem'
                }}
              >
                {lessonSearch
                  ? 'Không tìm thấy bài học phù hợp với từ khóa.'
                  : 'Chưa có bài học nào được công bố trong khóa học này.'}
              </div>
            ) : (
              lessons.map((lesson) => {
                const isSelected = selectedLessonId === lesson.id;
                const isDisabled = lesson.disabled || disabled;

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!lesson.disabled) {
                        onLessonSelect(lesson.id, lesson.label);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      backgroundColor: isSelected
                        ? 'var(--color-primary-subtle)'
                        : isDisabled
                        ? 'var(--color-surface-subtle)'
                        : 'var(--color-surface)',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      minHeight: '44px',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.875rem',
                          color: isSelected
                            ? 'var(--color-primary)'
                            : isDisabled
                            ? 'var(--color-text-muted)'
                            : 'var(--color-text-primary)',
                          wordBreak: 'break-word'
                        }}
                      >
                        {lesson.label}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            flexShrink: 0
                          }}
                        >
                          ✓ Đã chọn
                        </span>
                      )}
                    </div>
                    {lesson.disabled && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--status-danger-text)',
                          fontStyle: 'italic',
                          marginTop: '0.125rem'
                        }}
                      >
                        {lesson.disabledReason}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {selectedLesson && (
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <span>Đang chọn:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{selectedLesson.label}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
