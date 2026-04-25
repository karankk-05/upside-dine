import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isCrowdDemoEnabled } from '../demo/crowdDemo';

/**
 * WebSocket hook for real-time crowd density updates.
 *
 * Connects to ws://.../ws/crowd/mess/{mess_id}/
 * Listens for: density_update, wait_time_update
 * Updates React Query cache on each event.
 * Auto-reconnects with exponential backoff.
 * Gracefully degrades if WS is unavailable – the polling hook
 * (useLiveCrowdDensity) serves as the fallback.
 */
export function useCrowdSocket(messId, options = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);
  const maxReconnectAttempts = 10;
  const demoModeEnabled = options.demoMode ?? isCrowdDemoEnabled();

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/crowd/mess/${messId}/`;
  }, [messId]);

  const connect = useCallback(() => {
    if (demoModeEnabled) return;
    if (!messId) return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'density_update' || message.type === 'wait_time_update') {
            // Update React Query cache for live density
            queryClient.setQueryData(['crowd', 'live', messId, 'api'], (old) => ({
              ...old,
              ...message.data,
            }));
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        if (!event.wasClean && reconnectAttempt.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror — reconnection handled there
      };
    } catch {
      // WebSocket construction failed — server likely not supporting WS yet
      scheduleReconnect();
    }
  }, [demoModeEnabled, messId, getWsUrl, queryClient]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempt.current >= maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
    reconnectAttempt.current += 1;

    reconnectTimer.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttempt.current = 0;
  }, []);

  useEffect(() => {
    if (demoModeEnabled) {
      return undefined;
    }
    connect();
    return () => disconnect();
  }, [demoModeEnabled, messId, connect, disconnect]);

  return {
    isConnected: demoModeEnabled
      ? true
      : !!wsRef.current && wsRef.current.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}

export default useCrowdSocket;
