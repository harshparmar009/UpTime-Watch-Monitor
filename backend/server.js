const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const monitoringService = require('./services/monitoringService');
const swaggerRoute = require("./routes/swagger");
const eventRoute = require("./routes/events");

const websocketService = require("./services/websocketServices");


const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/monitors', require('./routes/monitors'));
app.use('/api/incidents', require('./routes/incidents'));
app.use("/api/swagger", swaggerRoute);
// eventRoute already contains router.post("/api-event")
app.use("/", eventRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('✅ MongoDB connected');
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       // Start background monitoring
//       monitoringService.startMonitoring();
//       console.log('📡 Monitoring service started');
//     });
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

  // Attach WebSocket server
// websocketService.initialize(httpServer);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    const httpServer = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);

      monitoringService.startMonitoring();

      console.log('📡 Monitoring service started');
    });

    websocketService.initialize(httpServer);

  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });