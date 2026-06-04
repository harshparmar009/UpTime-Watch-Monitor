const axios = require('axios');
const cron = require('node-cron');

const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
// const SwaggerEndPoint = require("../models/SwaggerEndPoint");
const SwaggerEndpoint = require('../models/SwaggerEndPoint')
const ApiEvent = require('../models/ApiEvent');

const MAX_CHECKS_STORED = 2000;

async function checkMonitor(monitor) {
  const startTime = Date.now();
  let status = 'down';
  let responseTime = null;
  let statusCode = null;
  let error = null;

  try {
    const response = await axios.get(monitor.url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (s) => s < 500, // treat 2xx-4xx as "up"
      headers: { 'User-Agent': 'UptimeMonitor/1.0' },
    });

    responseTime = Date.now() - startTime;
    statusCode = response.status;
    status = response.status < 400 ? 'up' : 'down';
  } catch (err) {
    responseTime = Date.now() - startTime;
    error = err.code || err.message || 'Unknown error';
    status = 'down';
  }

  const checkResult = {
    timestamp: new Date(),
    status,
    responseTime,
    statusCode,
    error,
  };

  // Handle incidents
  const wasDown = monitor.status === 'down';
  const isNowDown = status === 'down';
  const wasPending = monitor.status === 'pending';

  if (!wasPending) {
    if (isNowDown && !wasDown) {
      // Just went down — create incident
      await Incident.create({
        monitor: monitor._id,
        user: monitor.user,
        cause: error || `HTTP ${statusCode}`,
        status: 'ongoing',
      });
      await Monitor.findByIdAndUpdate(monitor._id, { $inc: { totalIncidents: 1 } });
    } else if (!isNowDown && wasDown) {
      // Came back up — resolve open incident
      const openIncident = await Incident.findOne({
        monitor: monitor._id,
        status: 'ongoing',
      });
      if (openIncident) {
        openIncident.resolve();
        await openIncident.save();
      }
    }
  }

  // Update monitor with new check
  const update = {
    status,
    lastChecked: new Date(),
    lastResponseTime: responseTime,
    $push: {
      checks: {
        $each: [checkResult],
        $slice: -MAX_CHECKS_STORED,
      },
    },
  };

  const updatedMonitor = await Monitor.findByIdAndUpdate(monitor._id, update, { new: true });

  // Recalculate stats
  if (updatedMonitor) {
    updatedMonitor.calculateStats();
    await updatedMonitor.save();
  }

  return checkResult;
}

// New function to check Swagger endpoints
async function checkSwaggerEndpoint(endpoint) {
  try {
    const monitor = await Monitor.findById(
      endpoint.monitor
    );

    if (!monitor || !monitor.isActive) {
      return;
    }

    const url =
      monitor.url.replace(/\/$/, "") +
      endpoint.path;

    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        validateStatus: () => true,
      });

      const responseTime =
        Date.now() - startTime;

      endpoint.lastEventAt =
        new Date();

      endpoint.lastStatusCode =
        response.status;

      endpoint.lastResponseTime =
        responseTime;

      endpoint.totalRequests += 1;

      endpoint.status =
        response.status < 400
          ? "active"
          : "error";

      if (response.status >= 400) {
        endpoint.totalErrors += 1;
      }

      await ApiEvent.create({
        monitor: monitor._id,
        endpoint: endpoint._id,

        path: endpoint.path,
        method: endpoint.method,

        statusCode: response.status,
        responseTime,

        requestBody: null,
        responseBody: null,

        errorMessage: null,

        timestamp: new Date(),
      });

      await endpoint.save();
    } catch (err) {
      endpoint.lastEventAt =
      //   new Date();

      // endpoint.totalRequests += 1;
      // endpoint.totalErrors += 1;
      // endpoint.status = "error";

      // await endpoint.save();

      endpoint.lastEventAt = new Date();

endpoint.totalRequests += 1;
endpoint.totalErrors += 1;
endpoint.status = "error";

await ApiEvent.create({
  monitor: monitor._id,
  endpoint: endpoint._id,

  path: endpoint.path,
  method: endpoint.method,

  statusCode: 0,
  responseTime: 0,

  requestBody: null,
  responseBody: null,

  errorMessage: err.message,

  timestamp: new Date(),
});

await endpoint.save();
    }
  } catch (err) {
    console.error(
      "Swagger endpoint check failed:",
      err.message
    );
  }
}

// Function to check all Swagger endpoints in cron mode
async function checkSwaggerEndpoints() {
  try {
    const endpoints =
      await SwaggerEndpoint.find({
        method: "GET",
        monitorMode: "cron",
      });

    for (const endpoint of endpoints) {
      await checkSwaggerEndpoint(
        endpoint
      );
    }
  } catch (err) {
    console.error(
      "Swagger monitoring error:",
      err.message
    );
  }
}


// Track active cron jobs
const cronJobs = new Map();

function scheduleMonitor(monitor) {
  const intervalMap = {
    1: '* * * * *',
    2: '*/2 * * * *',
    5: '*/5 * * * *',
    10: '*/10 * * * *',
    15: '*/15 * * * *',
    30: '*/30 * * * *',
    60: '0 * * * *',
  };

  const cronExpr = intervalMap[monitor.interval] || '*/5 * * * *';

  // Stop existing job if any
  if (cronJobs.has(monitor._id.toString())) {
    cronJobs.get(monitor._id.toString()).stop();
  }

  if (!monitor.isActive) return;

  const job = cron.schedule(cronExpr, async () => {
    try {
      const fresh = await Monitor.findById(monitor._id);
      if (fresh && fresh.isActive) {
        await checkMonitor(fresh);
      }
    } catch (err) {
      console.error(`Error checking monitor ${monitor._id}:`, err.message);
    }
  });

  cronJobs.set(monitor._id.toString(), job);
}

async function startMonitoring() {
  try {
    const monitors = await Monitor.find({ isActive: true });
    console.log(`📡 Scheduling ${monitors.length} monitors`);

    for (const monitor of monitors) {
      scheduleMonitor(monitor);
      // Stagger initial checks
      setTimeout(() => checkMonitor(monitor), Math.random() * 10000);
    }

    // Start Swagger endpoint monitoring
        cron.schedule("* * * * *", async () => {
          await checkSwaggerEndpoints();
        });

  } catch (err) {
    console.error('Failed to start monitoring:', err.message);
  }
}

module.exports = { checkMonitor, scheduleMonitor, startMonitoring, checkSwaggerEndpoint, checkSwaggerEndpoints };
