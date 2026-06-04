const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // seconds
    default: null,
  },
  status: {
    type: String,
    enum: ['ongoing', 'resolved'],
    default: 'ongoing',
  },
  cause: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Calculate duration on resolve
incidentSchema.methods.resolve = function () {
  this.resolvedAt = new Date();
  this.duration = Math.round((this.resolvedAt - this.startedAt) / 1000);
  this.status = 'resolved';
};

module.exports = mongoose.model('Incident', incidentSchema);
