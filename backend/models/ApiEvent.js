const mongoose = require('mongoose');

const apiEventSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
      index: true,
    },

    endpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwaggerEndpoint",
      required: true,
      index: true,
    },

    method: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    },

    path: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    statusCode: {
      type: Number,
      required: true,
      min: 100,
      max: 599,
    },

    responseTime: {
      type: Number,
      required: true,
      min: 0,
    },

    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
      trim: true,
    },

    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Common dashboard queries
apiEventSchema.index({ monitor: 1, timestamp: -1 });
apiEventSchema.index({ endpoint: 1, timestamp: -1 });
apiEventSchema.index({ statusCode: 1, timestamp: -1 });


module.exports = mongoose.model('ApiEvent', apiEventSchema);
