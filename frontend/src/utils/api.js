// /src/utils/api.js

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
console.log("FINAL API BASE URL =", `${API_BASE_URL}/api`);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Monitors
export const getMonitors = () => api.get("/monitors");

export const getMonitor = (id) =>
  api.get(`/monitors/${id}`);

export const createMonitor = (data) =>
  api.post("/monitors", data);

export const updateMonitor = (id, data) =>
  api.put(`/monitors/${id}`, data);

export const deleteMonitor = (id) =>
  api.delete(`/monitors/${id}`);

export const checkMonitorNow = (id) =>
  api.post(`/monitors/${id}/check`);

export const getResponseTimes = (id, hours = 24) =>
  api.get(`/monitors/${id}/response-times`, {
    params: { hours },
  });

// Incidents
export const getIncidents = (params = {}) =>
  api.get("/incidents", {
    params,
  });

// Swagger
export const syncSwagger = (monitorId, swaggerUrl) =>
  api.post(`/swagger/${monitorId}/sync`, {
    swaggerUrl,
  });

export const getEndpoints = (monitorId) =>
  api.get(`/swagger/${monitorId}/endpoints`);

export const getEndpoint = (monitorId, endpointId) =>
  api.get(
    `/swagger/${monitorId}/endpoints/${endpointId}`
  );

export const deleteEndpoint = (monitorId, endpointId) =>
  api.delete(
    `/swagger/${monitorId}/endpoints/${endpointId}`
  );

export const deleteAllEndpoints = (monitorId) =>
  api.delete(`/swagger/${monitorId}/endpoints`);

export const manualCheckEndpoint = (
  monitorId,
  endpointId,
  data
) =>
  api.post(
    `/swagger/${monitorId}/endpoints/${endpointId}/manual-check`,
    data
  );

export default api;