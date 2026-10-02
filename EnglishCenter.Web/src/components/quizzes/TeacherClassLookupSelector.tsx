import React, { useEffect, useRef, useState } from 'react';
import { quizService } from '../../services/quiz.service';
import type { TeacherQuizClassLookupItemResponse } from '../../types/quiz.types';

interface TeacherClassLookupSelectorProps {
  value: number;
  onChange: (classId: number, classItem?: TeacherQuizClassLookupItemResponse) => void;
  disabled?: boolean;
}

export const TeacherClassLookupSelector: React.FC<TeacherClassLookupSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [classes, setClasses] = useState<TeacherQuizClassLookupItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchClasses = async (search: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      const res = await quizService.getTeacherClassLookup(
        { search: search.trim() || undefined, page: 1, pageSize: 50 },
        controller.signal
      );
      if (res.success && res.data) {
        setClasses(res.data.items);
      }
    } catch {
      // Ignore cancelled or aborted requests
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchClasses(''));
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    fetchClasses(text);
  };

  const selectedClass = classes.find((c) => c.classId === value);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="Tìm mã hoặc tên lớp học..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem'
          }}
        />
      </div>

      <select
        value={value || 0}
        onChange={(e) => {
          const id = parseInt(e.target.value, 10);
          const item = classes.find((c) => c.classId === id);
          onChange(id, item);
        }}
        disabled={disabled || isLoading}
        style={{
          width: '100%',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.875rem'
        }}
      >
        <option value={0} disabled>
          {isLoading ? 'Đang tải danh sách lớp...' : '-- Chọn lớp học --'}
        </option>
        {classes.map((c) => (
          <option key={c.classId} value={c.classId}>
            {c.classCode} - {c.courseName} ({c.quizCount} bài kiểm tra)
          </option>
        ))}
      </select>

      {selectedClass && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem' }}>
          Đã chọn: <strong>{selectedClass.classCode}</strong> ({selectedClass.courseName}) &bull; Trạng thái: {selectedClass.status}
        </div>
      )}
    </div>
  );
};
