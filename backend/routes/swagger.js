const express = require("express");
const axios = require("axios");

const Monitor = require("../models/Monitor");
const SwaggerEndpoint = require("../models/SwaggerEndpoint");
const ApiEvent = require("../models/ApiEvent");
// const { isAuthenticated } = require("../middlewares/authMiddleware");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/swagger/:monitorId/sync
 * Fetch swagger.json and save endpoints
 */
router.post(
  "/:monitorId/sync",
  auth,
  async (req, res) => {
    try {
      const { monitorId } = req.params;
      const { swaggerUrl } = req.body;

      if (!swaggerUrl) {
        return res.status(400).json({
          success: false,
          message: "swaggerUrl is required",
        });
      }

      const monitor = await Monitor.findOne({
        _id: monitorId,
        user: req.user._id,
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: "Monitor not found",
        });
      }

      const { data } = await axios.get(swaggerUrl);

      const globalRequiresAuth =
      Array.isArray(data.security) &&
      data.security.length > 0;

      if (!data.paths) {
        return res.status(400).json({
          success: false,
          message: "Invalid Swagger document",
        });
      }

      const endpoints = [];

     for (const [path, methods] of Object.entries(data.paths)) {
  for (const [method, details] of Object.entries(methods)) {


   const endpointRequiresAuth =
      Array.isArray(details.security) &&
      details.security.length > 0;

    const requiresAuth =
      globalRequiresAuth ||
      endpointRequiresAuth;


      const pathParams =
        details.parameters?.filter(
          p => p.in === "path"
        ) || [];

      const queryParams =
        details.parameters?.filter(
          p => p.in === "query"
        ) || [];

  const upperMethod = method.toUpperCase();

  const hasPathParams = path.includes("{");

  const hasQueryParams =
    details.parameters?.some(
      p => p.in === "query"
    ) || false;

  // const requiresAuth =
  //   details.security &&
  //   details.security.length > 0;

  const autoMonitorEligible =
    upperMethod === "GET" &&
    !hasPathParams &&
    !hasQueryParams &&
    !requiresAuth;

    const endpoint =
      await SwaggerEndpoint.findOneAndUpdate(
        {
          monitor: monitor._id,
          path,
          method: upperMethod,
        },
        {
          monitor: monitor._id,
          user: req.user._id,

          path,
          method: upperMethod,

          summary: details.summary || "",
          tags: details.tags || [],
          operationId: details.operationId || "",

          hasPathParams,

          pathParams,
          queryParams,

          monitorMode:
          autoMonitorEligible
            ? "cron"
            : "manual",
        },
        {
          upsert: true,
          new: true,
        }
      );

    endpoints.push(endpoint);
  }
}

      monitor.swaggerUrl = swaggerUrl;
      await monitor.save();

      res.status(200).json({
        success: true,
        count: endpoints.length,
        endpoints,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/swagger/:monitorId/endpoints
 * Get all endpoints for monitor
 */
router.get(
  "/:monitorId/endpoints",
  auth,
  async (req, res) => {
    try {
      const { monitorId } = req.params;

      const endpoints =
        await SwaggerEndpoint.find({
          monitor: monitorId,
        }).sort({
          path: 1,
          method: 1,
        });

      res.status(200).json({
        success: true,
        count: endpoints.length,
        endpoints,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/swagger/:monitorId/endpoints/:endpointId
 * Get endpoint details + last 50 events
 */
router.get(
  "/:monitorId/endpoints/:endpointId",
  auth,
  async (req, res) => {
    try {
      const { endpointId } = req.params;

      const endpoint =
        await SwaggerEndpoint.findById(endpointId);

      if (!endpoint) {
        return res.status(404).json({
          success: false,
          message: "Endpoint not found",
        });
      }

      const events = await ApiEvent.find({
        endpoint: endpointId,
      })
        .sort({ timestamp: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        endpoint,
        events,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Function to check one endpoint
//post /:monitorId/endpoints/:endpointId/manual-check
router.post(
  "/:monitorId/endpoints/:endpointId/manual-check",
  auth,
  async (req, res) => {
    try {
      const { monitorId, endpointId } = req.params;

      const {
        pathParams = {},
        requestBody = {},
        headers = {},
      } = req.body;

      const endpoint =
        await SwaggerEndpoint.findById(
          endpointId
        );

        // console.log("Manual check for endpoint:", endpoint);

      if (!endpoint) {
        return res.status(404).json({
          success: false,
          message: "Endpoint not found",
        });
      }

      const monitor =
        await Monitor.findById(
          monitorId
        );

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: "Monitor not found",
        });
      }

      // Replace path params
      let endpointPath =
        endpoint.path;

      Object.entries(
        pathParams
      ).forEach(([key, value]) => {
        endpointPath =
          endpointPath.replace(
            `{${key}}`,
            value
          );
      });

      // const url =
      //   monitor.url.replace(
      //     /\/$/,
      //     ""
      //   ) + endpointPath;

        // const baseUrl = monitor.swaggerUrl
        //   .replace("/swagger.json", "")
        //   .replace(/\/swagger\/v\d+$/, "");

        const swaggerUrl = monitor.swaggerUrl || "";
        const baseUrl = new URL(swaggerUrl).origin;
        const url = baseUrl + endpointPath;  
        

        console.log("swagger manual check - final URL:", url);

      const start = Date.now();

      let response;

      console.log(
  typeof requestBody,
  requestBody
);

console.log("Calling URL:", url);
console.log("Method:", endpoint.method);
console.log("Body:", requestBody);
console.log("Headers:", headers);

      try {
        response = await axios({
          method:
            endpoint.method.toLowerCase(),

          url,

          data:
            endpoint.method ===
              "POST" ||
            endpoint.method ===
              "PUT" ||
            endpoint.method ===
              "PATCH"
              ? requestBody
              : undefined,

          headers: {
            "Content-Type": "application/json",
            ...headers,
          },

          validateStatus: () => true,
        });
      } catch (error) {

        console.log("AXIOS ERROR:");
  console.log(error.message);

  console.log("ERROR RESPONSE:");
  console.log(error.response?.status);

  console.log(error.response?.data);

  console.log("REQUEST URL:");
  console.log(url);

  console.log("REQUEST BODY:");
  console.log(requestBody);

        const responseTime =
          Date.now() - start;

        await ApiEvent.create({
          monitor: monitor._id,
          endpoint: endpoint._id,

          path: endpointPath,
          method:
            endpoint.method,

          statusCode: 0,

          responseTime,

          requestBody,

          responseBody: null,

          errorMessage:
            error.message,

          timestamp:
            new Date(),
        });

        endpoint.totalRequests += 1;
        endpoint.totalErrors += 1;

        endpoint.lastEventAt =
          new Date();

        endpoint.status =
          "error";

        await endpoint.save();

        return res.status(500).json({
          success: false,
          message:
            error.message,
        });
      }

      const responseTime =
        Date.now() - start;

      await ApiEvent.create({
        monitor: monitor._id,

        endpoint:
          endpoint._id,

        path: endpointPath,

        method:
          endpoint.method,

        statusCode:
          response.status,

        responseTime,

        requestBody,

        responseBody:
          response.data,

        errorMessage:
          response.status >= 400
            ? `HTTP ${response.status}`
            : null,

        timestamp:
          new Date(),
      });

      endpoint.totalRequests += 1;

      if (
        response.status >= 400
      ) {
        endpoint.totalErrors += 1;
      }

      endpoint.lastStatusCode =
        response.status;

      endpoint.lastResponseTime =
        responseTime;

      endpoint.lastEventAt =
        new Date();

      endpoint.status =
        response.status >= 400
          ? "error"
          : "active";

      await endpoint.save();

      res.json({
        success: true,

        method:
          endpoint.method,

        url,

        statusCode:
          response.status,

        responseTime,

        responseBody:
          response.data,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  }
);


/**
 * DELETE /api/swagger/:monitorId/endpoints/:endpointId
 * Delete one endpoint + its events
 */
router.delete(
  "/:monitorId/endpoints/:endpointId",
  auth,
  async (req, res) => {
    try {
      const { endpointId } = req.params;

      await SwaggerEndpoint.findByIdAndDelete(
        endpointId
      );

      await ApiEvent.deleteMany({
        endpoint: endpointId,
      });

      res.status(200).json({
        success: true,
        message: "Endpoint deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/swagger/:monitorId/endpoints
 * Delete all endpoints + events
 */
router.delete(
  "/:monitorId/endpoints",
  auth,
  async (req, res) => {
    try {
      const { monitorId } = req.params;

      const endpoints =
        await SwaggerEndpoint.find({
          monitor: monitorId,
        });

      const endpointIds = endpoints.map(
        (endpoint) => endpoint._id
      );

      await ApiEvent.deleteMany({
        endpoint: {
          $in: endpointIds,
        },
      });

      await SwaggerEndpoint.deleteMany({
        monitor: monitorId,
      });

      res.status(200).json({
        success: true,
        message:
          "All endpoints and events deleted",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;