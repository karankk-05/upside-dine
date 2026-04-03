import { useEffect, useRef } from "react";

export const useOrderSocket = (orderId, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    // In production, WebSocket goes to IITK server (Netlify can't proxy WS)
    // Set VITE_WS_URL in Netlify env vars to ws://172.27.16.252
    const wsBase = import.meta.env.VITE_WS_URL;
    let wsUrl;
    if (wsBase) {
      wsUrl = `${wsBase}/ws/order/${orderId}/`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws/order/${orderId}/`;
    }
    const ws = new WebSocket(wsUrl);

    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "status_update") {
          onStatusUpdate(data.status);
        }
      } catch (err) {
        console.error("Socket parse error", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => {
      ws.close();
    };
  }, [orderId, onStatusUpdate]);
};