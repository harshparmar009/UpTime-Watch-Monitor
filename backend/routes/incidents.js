const express = require('express');
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all incidents for user
router.get('/', auth, async (req, res) => {
  try {
    const { monitorId, status, limit = 20, page = 1 } = req.query;

    const query = { user: req.user._id };
    if (monitorId) query.monitor = monitorId;
    if (status) query.status = status;

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('monitor', 'name url')
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ incidents, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
