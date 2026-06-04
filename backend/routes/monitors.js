const express = require('express');
const crypto = require("crypto");
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');
const monitoringService = require('../services/monitoringService');

const router = express.Router();

// Get all monitors for user
router.get('/', auth, async (req, res) => {
  try {
    const monitors = await Monitor.find({ user: req.user._id })
      .select('-checks')
      .sort({ createdAt: -1 });
    res.json({ monitors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single monitor with checks
router.get('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, user: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

    // Return last 100 checks for chart
    const checks = monitor.checks.slice(-100).reverse();
    const monitorData = monitor.toObject();
    monitorData.checks = checks;

    res.json({ monitor: monitorData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create monitor
router.post('/', auth, async (req, res) => {
  try {
    const { name, url, interval } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: 'Name and URL are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // const monitor = await Monitor.create({
    //   user: req.user._id,
    //   name,
    //   url,
    //   interval: interval || 5,
    // });

    const apiKey = crypto.randomBytes(32).toString("hex");

const monitor = await Monitor.create({
  user: req.user._id,
  name,
  url,
  interval: interval || 5,
  apiKey,
});

    // Run first check immediately
    monitoringService.checkMonitor(monitor);

    res.status(201).json({ message: 'Monitor created', monitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update monitor
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, url, interval, isActive } = req.body;

    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, url, interval, isActive },
      { new: true, runValidators: true }
    );

    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json({ message: 'Monitor updated', monitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete monitor
router.delete('/:id', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

    // Delete related incidents
    await Incident.deleteMany({ monitor: req.params.id });

    res.json({ message: 'Monitor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Trigger manual check
router.post('/:id/check', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, user: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

    const result = await monitoringService.checkMonitor(monitor);
    res.json({ message: 'Check completed', result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get response time chart data
router.get('/:id/response-times', auth, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, user: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

    const hours = parseInt(req.query.hours) || 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const checks = monitor.checks
      .filter(c => c.timestamp >= cutoff && c.responseTime !== null)
      .slice(-200)
      .map(c => ({
        timestamp: c.timestamp,
        responseTime: c.responseTime,
        status: c.status,
      }));

    res.json({ checks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
