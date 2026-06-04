const WebSocket = require("ws");

// endpointId => Set<WebSocket>
const subscriptions = new Map();

let wss = null;

/**
 * Initialize WebSocket server
 */
function initialize(server) {
  wss = new WebSocket.Server({
    server,
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.subscribedEndpoints = new Set();

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "subscribe") {
          subscribe(ws, data.endpointId);
        }
      } catch (error) {
        console.error(
          "WebSocket message error:",
          error.message
        );
      }
    });

    ws.on("close", () => {
      cleanup(ws);

      console.log(
        "WebSocket client disconnected"
      );
    });

    ws.on("error", (error) => {
      console.error(
        "WebSocket error:",
        error.message
      );

      cleanup(ws);
    });
  });

  console.log("WebSocket server initialized");
}

/**
 * Subscribe client to endpoint
 */
function subscribe(ws, endpointId) {
  if (!endpointId) return;

  if (!subscriptions.has(endpointId)) {
    subscriptions.set(endpointId, new Set());
  }

  subscriptions.get(endpointId).add(ws);

  ws.subscribedEndpoints.add(endpointId);

  ws.send(
    JSON.stringify({
      type: "subscribed",
      endpointId,
    })
  );
}

/**
 * Broadcast event to subscribers
 */
function broadcast(endpointId, data) {
  const clients =
    subscriptions.get(String(endpointId));

  if (!clients) return;

  const payload = JSON.stringify({
    type: "endpoint-event",
    endpointId,
    data,
  });

  for (const client of clients) {
    if (
      client.readyState === WebSocket.OPEN
    ) {
      client.send(payload);
    }
  }
}

/**
 * Cleanup disconnected client
 */
function cleanup(ws) {
  if (!ws.subscribedEndpoints) return;

  for (const endpointId of ws.subscribedEndpoints) {
    const clients =
      subscriptions.get(endpointId);

    if (!clients) continue;

    clients.delete(ws);

    if (clients.size === 0) {
      subscriptions.delete(endpointId);
    }
  }

  ws.subscribedEndpoints.clear();
}

module.exports = {
  initialize,
  subscribe,
  broadcast,
};