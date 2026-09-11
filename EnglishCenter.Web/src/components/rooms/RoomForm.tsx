import React, { useState } from 'react';
import type {
  CreateRoomPayload,
  RoomDetail,
  UpdateRoomPayload
} from '../../types/room.types';
import {
  normalizeOptionalRoomName,
  validateCapacity,
  validateRoomCode,
  validateRoomName
} from '../../utils/roomHelper';
import { RoomStatusBadge } from './RoomStatusBadge';

type RoomFormProps =
  | {
      mode: 'create';
      initialData?: never;
      onSubmit: (payload: CreateRoomPayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    }
  | {
      mode: 'edit';
      initialData?: RoomDetail | null;
      onSubmit: (payload: UpdateRoomPayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    };

export const RoomForm: React.FC<RoomFormProps> = (props) => {
  const {
    mode,
    initialData,
    onCancel,
    isSubmitting = false,
    serverError = null
  } = props;

  // Form field states
  const [roomCode, setRoomCode] = useState<string>(initialData?.roomCode || '');
  const [roomName, setRoomName] = useState<string>(initialData?.roomName || '');
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity !== undefined ? String(initialData.capacity) : ''
  );

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. RoomCode (Create mode only)
    if (mode === 'create') {
      const codeRes = validateRoomCode(roomCode);
      if (!codeRes.isValid && codeRes.error) {
        newErrors.roomCode = codeRes.error;
      }
    }

    // 2. RoomName (optional, max 100 on normalized string)
    const normalizedName = normalizeOptionalRoomName(roomName);
    const nameRes = validateRoomName(normalizedName);
    if (!nameRes.isValid && nameRes.error) {
      newErrors.roomName = nameRes.error;
    }

    // 3. Capacity (required positive integer)
    const capRes = validateCapacity(capacity);
    if (!capRes.isValid && capRes.error) {
      newErrors.capacity = capRes.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    const normalizedName = normalizeOptionalRoomName(roomName);
    const capRes = validateCapacity(capacity);

    if (!capRes.isValid || capRes.value === undefined) {
      return;
    }

    if (mode === 'create') {
      const normalizedCode = roomCode.trim();
      const payload: CreateRoomPayload = {
        roomCode: normalizedCode,
        roomName: normalizedName,
        capacity: capRes.value
      };
      await (props as { onSubmit: (payload: CreateRoomPayload) => Promise<void> }).onSubmit(payload);
    } else {
      const payload: UpdateRoomPayload = {
        roomName: normalizedName,
        capacity: capRes.value
      };
      await (props as { onSubmit: (payload: UpdateRoomPayload) => Promise<void> }).onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }} noValidate>
      {/* Server Error Alert */}
      {serverError && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5
          }}
          role="alert"
        >
          {serverError}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Status display in Edit mode (read-only informational) */}
        {mode === 'edit' && initialData && (
          <div>
            <span style={labelStyle}>Trạng thái hiện tại</span>
            <div style={{ marginTop: '0.375rem' }}>
              <RoomStatusBadge status={initialData.status} />
            </div>
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Trạng thái phòng học được quản lý độc lập qua nút &ldquo;Đổi trạng thái&rdquo; tại trang chi tiết hoặc danh sách.
            </p>
          </div>
        )}

        {/* RoomCode */}
        <div>
          <label htmlFor="roomCode" style={labelStyle}>
            Mã phòng học {mode === 'create' && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            disabled={mode === 'edit' || isSubmitting}
            placeholder="Ví dụ: A101, LAB-B02, P201..."
            maxLength={35}
            style={{
              ...inputStyle,
              backgroundColor: mode === 'edit' ? 'var(--color-surface-subtle, #f1f5f9)' : 'var(--color-canvas, #ffffff)',
              cursor: mode === 'edit' ? 'not-allowed' : 'text',
              borderColor: errors.roomCode ? '#ef4444' : 'var(--color-border, #cbd5e1)'
            }}
            aria-required={mode === 'create'}
            aria-invalid={Boolean(errors.roomCode)}
          />
          {mode === 'edit' && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Mã phòng học không thể thay đổi sau khi tạo.
            </p>
          )}
          {errors.roomCode && <p style={errorTextStyle}>{errors.roomCode}</p>}
        </div>

        {/* RoomName */}
        <div>
          <label htmlFor="roomName" style={labelStyle}>
            Tên phòng học <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 400 }}>(Tùy chọn)</span>
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ví dụ: Phòng Thực Hành Tin Học, Phòng Hội Thảo 1..."
            maxLength={105}
            style={{
              ...inputStyle,
              borderColor: errors.roomName ? '#ef4444' : 'var(--color-border, #cbd5e1)'
            }}
            aria-invalid={Boolean(errors.roomName)}
          />
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
            Để trống nếu chưa có tên gọi riêng (hệ thống sẽ hiển thị &ldquo;Chưa đặt tên&rdquo;).
          </p>
          {errors.roomName && <p style={errorTextStyle}>{errors.roomName}</p>}
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" style={labelStyle}>
            Sức chứa (số chỗ ngồi) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="capacity"
            type="text"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ví dụ: 30"
            style={{
              ...inputStyle,
              borderColor: errors.capacity ? '#ef4444' : 'var(--color-border, #cbd5e1)'
            }}
            aria-required="true"
            aria-invalid={Boolean(errors.capacity)}
          />
          {errors.capacity && <p style={errorTextStyle}>{errors.capacity}</p>}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'var(--color-primary, #1e40af)',
            color: '#ffffff',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'opacity 0.15s ease'
          }}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Đang tạo...'
              : 'Đang lưu...'
            : mode === 'create'
            ? 'Tạo phòng học'
            : 'Lưu thay đổi'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary, #475569)',
            border: '1px solid var(--color-border, #cbd5e1)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary, #0f172a)',
  marginBottom: '0.375rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md, 8px)',
  border: '1px solid var(--color-border, #cbd5e1)',
  backgroundColor: 'var(--color-canvas, #ffffff)',
  color: 'var(--color-text-primary, #0f172a)',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};

const errorTextStyle: React.CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.75rem',
  color: '#ef4444',
  fontWeight: 500
};
