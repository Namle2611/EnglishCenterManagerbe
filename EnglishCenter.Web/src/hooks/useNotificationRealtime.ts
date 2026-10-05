import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { refreshAccessToken } from '../api/axiosClient';
import { authStorage } from '../utils/authStorage';
import {
  getNotificationHubUrl,
  isTokenExpired,
  triggerNotificationInboxRefresh,
  triggerUnreadCountRefresh
} from '../utils/notificationHelper';

interface UseNotificationRealtimeOptions {
  enabled?: boolean;
}

export function useNotificationRealtime(options: UseNotificationRealtimeOptions = {}): void {
  const { enabled = false } = options;
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (connectionRef.current) {
        const conn = connectionRef.current;
        connectionRef.current = null;
        conn.stop().catch(() => {});
      }
      return;
    }

    const hubUrl = getNotificationHubUrl();

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => {
          let token = authStorage.getAccessToken();
          if (isTokenExpired(token)) {
            token = await refreshAccessToken();
          }
          return token || '';
        }
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    const handleNotificationReceived = () => {
      triggerUnreadCountRefresh();
      triggerNotificationInboxRefresh();
    };

    connection.on('NotificationReceived', handleNotificationReceived);

    connection.start().catch(() => {
      // Safe silent failure; 60s REST polling acts as fallback
    });

    return () => {
      connection.off('NotificationReceived', handleNotificationReceived);
      connectionRef.current = null;
      connection.stop().catch(() => {});
    };
  }, [enabled]);
}
