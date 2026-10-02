import React, { useEffect, useState } from 'react';
import { calculateRemainingSeconds, formatRemainingTime } from '../../utils/quizHelper';

interface StudentAttemptTimerProps {
  effectiveDeadline: string | null;
  onExpire: () => void;
}

export const StudentAttemptTimer: React.FC<StudentAttemptTimerProps> = ({
  effectiveDeadline,
  onExpire
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    calculateRemainingSeconds(effectiveDeadline)
  );

  useEffect(() => {
    if (!effectiveDeadline) {
      void Promise.resolve().then(() => setRemainingSeconds(null));
      return;
    }

    const updateTimer = () => {
      const sec = calculateRemainingSeconds(effectiveDeadline);
      setRemainingSeconds(sec);
      if (sec !== null && sec <= 0) {
        onExpire();
      }
    };

    void Promise.resolve().then(updateTimer);
    const interval = window.setInterval(updateTimer, 1000);

    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [effectiveDeadline, onExpire]);

  if (effectiveDeadline === null || remainingSeconds === null) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          border: '1px solid var(--color-border)'
        }}
      >
        <span>⏱️</span>
        <span>Không giới hạn thời gian</span>
      </div>
    );
  }

  // Visual thresholds:
  // <= 60s: Danger pulse
  // <= 300s (5m): Warning amber
  // > 300s: Normal neutral
  const isDanger = remainingSeconds <= 60;
  const isWarning = remainingSeconds <= 300 && !isDanger;

  let bg = 'var(--color-surface-subtle)';
  let color = 'var(--color-text-primary)';
  let border = '1px solid var(--color-border)';

  if (isDanger) {
    bg = 'var(--status-danger-bg, rgba(239, 68, 68, 0.15))';
    color = 'var(--status-danger-text, #dc2626)';
    border = '1px solid var(--status-danger-border, rgba(239, 68, 68, 0.4))';
  } else if (isWarning) {
    bg = 'var(--status-warning-bg, rgba(245, 158, 11, 0.15))';
    color = 'var(--status-warning-text, #b45309)';
    border = '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.4))';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.875rem',
        borderRadius: 'var(--radius-full)',
        backgroundColor: bg,
        color,
        border,
        fontSize: '0.9375rem',
        fontWeight: 700,
        boxShadow: isDanger ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
        transition: 'all 0.2s ease'
      }}
      aria-live="polite"
      role="timer"
    >
      <span>{isDanger ? '⚠️' : isWarning ? '⏳' : '⏱️'}</span>
      <span className="font-mono">{formatRemainingTime(remainingSeconds)}</span>
      {isDanger && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.25rem' }}>
          (Sắp hết giờ!)
        </span>
      )}
    </div>
  );
};
