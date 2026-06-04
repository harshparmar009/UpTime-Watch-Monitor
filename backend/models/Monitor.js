const mongoose = require('mongoose');

const checkResultSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['up', 'down'], required: true },
  responseTime: { type: Number, default: null }, // ms
  statusCode: { type: Number, default: null },
  error: { type: String, default: null },
});

const monitorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Monitor name is required'],
    trim: true,
    maxlength: 100,
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['http', 'https'],
    default: 'https',
  },
  interval: {
    type: Number,
    default: 5, // minutes
    enum: [1, 2, 5, 10, 15, 30, 60],
  },
  status: {
    type: String,
    enum: ['up', 'down', 'pending'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastChecked: {
    type: Date,
    default: null,
  },
  lastResponseTime: {
    type: Number,
    default: null,
  },

    apiKey: {
    type: String,
    unique: true,
    index: true,
  },

  swaggerUrl: {
    type: String,
    default: null,
    trim: true,
  },
  
  // Store last 90 days of checks (we keep last 1000 results)
  checks: {
    type: [checkResultSchema],
    default: [],
  },
  // Aggregated stats
  uptime24h: { type: Number, default: null },   // percentage
  uptime7d: { type: Number, default: null },
  uptime30d: { type: Number, default: null },
  avgResponseTime24h: { type: Number, default: null },
  totalIncidents: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual for uptime percentage (last 24h)
monitorSchema.methods.calculateStats = function () {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const last24h = this.checks.filter(c => now - c.timestamp < day);
  const last7d = this.checks.filter(c => now - c.timestamp < 7 * day);
  const last30d = this.checks.filter(c => now - c.timestamp < 30 * day);

  const calcUptime = (checks) => {
    if (!checks.length) return null;
    const up = checks.filter(c => c.status === 'up').length;
    return parseFloat(((up / checks.length) * 100).toFixed(2));
  };

  const calcAvgResponse = (checks) => {
    const valid = checks.filter(c => c.responseTime !== null);
    if (!valid.length) return null;
    return Math.round(valid.reduce((sum, c) => sum + c.responseTime, 0) / valid.length);
  };

  this.uptime24h = calcUptime(last24h);
  this.uptime7d = calcUptime(last7d);
  this.uptime30d = calcUptime(last30d);
  this.avgResponseTime24h = calcAvgResponse(last24h);
};

module.exports = mongoose.model('Monitor', monitorSchema);
