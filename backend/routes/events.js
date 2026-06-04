const express = require("express");

const Monitor = require("../models/Monitor");
const SwaggerEndpoint = require("../models/SwaggerEndpoint");
const ApiEvent = require("../models/ApiEvent");

const router = express.Router();

/**
 * POST /api-event
 *
 * Auth:
 * X-Monitor-Key header
 */
router.post("/api-event", async (req, res) => {
  try {
    const monitorKey = req.header("X-Monitor-Key");

    if (!monitorKey) {
      return res.status(401).json({
        success: false,
        message: "X-Monitor-Key header required",
      });
    }

    const monitor = await Monitor.findOne({
      apiKey: monitorKey,
    });

    if (!monitor) {
      return res.status(401).json({
        success: false,
        message: "Invalid monitor key",
      });
    }

    const {
      path,
      method,
      statusCode,
      responseTime,
      requestBody,
      responseBody,
      errorMessage,
    } = req.body;

    if (!path || !method) {
      return res.status(400).json({
        success: false,
        message: "path and method are required",
      });
    }

    const endpoint = await SwaggerEndpoint.findOne({
      monitor: monitor._id,
      path,
      method: method.toUpperCase(),
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found in Swagger endpoints",
      });
    }

    const event = await ApiEvent.create({
      monitor: monitor._id,
      endpoint: endpoint._id,

      path,
      method: method.toUpperCase(),

      statusCode,
      responseTime,

      requestBody,
      responseBody,

      errorMessage,

      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress,

      timestamp: new Date(),
    });

    endpoint.lastEventAt = new Date();

    endpoint.lastStatusCode = statusCode;

    endpoint.lastResponseTime = responseTime;

    endpoint.totalRequests += 1;

    if (statusCode >= 400) {
      endpoint.totalErrors += 1;
      endpoint.status = "error";
    } else {
      endpoint.status = "active";
    }

    await endpoint.save();

    // Socket.IO broadcast
    if (req.app.get("io")) {
      req.app.get("io").emit("api-event", {
        endpointId: endpoint._id,
        endpoint: endpoint.path,
        method: endpoint.method,

        statusCode,
        responseTime,

        timestamp: event.timestamp,
      });
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;