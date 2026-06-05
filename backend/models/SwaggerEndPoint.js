const mongoose = require('mongoose');

const swaggerEndpointSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    method: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    operationId: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "error", "unknown"],
      default: "unknown",
    },

    lastEventAt: {
      type: Date,
      default: null,
    },

    lastStatusCode: {
      type: Number,
      default: null,
    },

    lastResponseTime: {
      type: Number,
      default: null,
    },

    totalRequests: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalErrors: {
      type: Number,
      default: 0,
      min: 0,
    },
    

    //adding new field 
    monitorMode: {
    type: String,
    enum: ["cron", "manual"],
    default: "manual",
},

hasPathParams: {
  type: Boolean,
  default: false,
},

hasQueryParams: {
  type: Boolean,
  default: false,
},

requiresAuth: {
  type: Boolean,
  default: false,
},

pathParams: {
  type: Array,
  default: [],
},

queryParams: {
  type: Array,
  default: [],
},

  },
  {
    timestamps: true,
  }
);

// Prevent duplicate endpoints for the same monitor
swaggerEndpointSchema.index(
  {
    monitor: 1,
    path: 1,
    method: 1,
  },
  {
    unique: true,
  }
);


// module.exports = mongoose.model('SwaggerEndpoint', swaggerEndpointSchema);

module.exports =
  mongoose.models.SwaggerEndpoint ||
  mongoose.model("SwaggerEndpoint", swaggerEndpointSchema);

