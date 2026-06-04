import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Monitors
export const getMonitors = () => api.get('/monitors');
export const getMonitor = (id) => api.get(`/monitors/${id}`);
export const createMonitor = (data) => api.post('/monitors', data);
export const updateMonitor = (id, data) => api.put(`/monitors/${id}`, data);
export const deleteMonitor = (id) => api.delete(`/monitors/${id}`);
export const checkMonitorNow = (id) => api.post(`/monitors/${id}/check`);
export const getResponseTimes = (id, hours = 24) =>
  api.get(`/monitors/${id}/response-times?hours=${hours}`);

// Incidents
export const getIncidents = (params = {}) =>
  api.get('/incidents', { params });


// Swagger

export const syncSwagger = (monitorId, swaggerUrl) =>
  api.post(`/swagger/${monitorId}/sync`, {
    swaggerUrl,
  });

export const getEndpoints = (monitorId) =>
  api.get(`/swagger/${monitorId}/endpoints`);

export const getEndpoint = (
  monitorId,
  endpointId
) =>
  api.get(
    `/swagger/${monitorId}/endpoints/${endpointId}`
  );

export const deleteEndpoint = (
  monitorId,
  endpointId
) =>
  api.delete(
    `/swagger/${monitorId}/endpoints/${endpointId}`
  );

export const deleteAllEndpoints = (
  monitorId
) =>
  api.delete(
    `/swagger/${monitorId}/endpoints`
  );

  
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
