// const WS_URL = "ws://localhost:5000";
const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, "ws")
  : "ws://localhost:5000";

export function subscribe(endpointId, onEvent) {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "subscribe",
        endpointId,
      })
    );
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "endpoint-event") {
        onEvent(message.data);
      }
    } catch (error) {
      console.error(
        "WebSocket message error:",
        error
      );
    }
  };

  ws.onerror = (error) => {
    console.error(
      "WebSocket connection error:",
      error
    );
  };

  ws.onclose = () => {
    console.log(
      "WebSocket connection closed"
    );
  };

  return () => {
    ws.close();
  };
}