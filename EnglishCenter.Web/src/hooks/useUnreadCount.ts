import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationService } from '../services/notification.service';
import { NOTIFICATION_REFRESH_EVENT } from '../utils/notificationHelper';

interface UseUnreadCountOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export interface UseUnreadCountResult {
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useUnreadCount(options: UseUnreadCountOptions = {}): UseUnreadCountResult {
  const { enabled = true, intervalMs = 60_000 } = options;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await notificationService.getUnreadCount(controller.signal);
      if (response && response.success && response.data) {
        setUnreadCount(response.data.unreadCount ?? 0);
      }
    } catch (err: unknown) {
      // Do not surface abort/canceled errors
      if (err instanceof Error && err.name === 'CanceledError') {
        return;
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;

    const handleRefreshEvent = () => {
      fetchUnreadCount();
    };

    if (!enabled) {
      initialTimer = setTimeout(() => {
        setUnreadCount(0);
      }, 0);
      return () => {
        if (initialTimer) clearTimeout(initialTimer);
      };
    }

    // 1. Initial fetch on mount
    initialTimer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);

    // 2. Setup periodic interval polling (60s)
    timerId = setInterval(() => {
      fetchUnreadCount();
    }, intervalMs);

    // 3. Listen for immediate refresh events from mutation actions
    window.addEventListener(NOTIFICATION_REFRESH_EVENT, handleRefreshEvent);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (timerId) clearInterval(timerId);
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, handleRefreshEvent);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, intervalMs, fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount
  };
}
