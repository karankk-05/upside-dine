import { useEffect, useRef } from "react";

export const useOrderSocket = (orderId, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(
      `${protocol}//${host}/ws/order/${orderId}/`
    );

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