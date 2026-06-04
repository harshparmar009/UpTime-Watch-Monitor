import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, ExternalLink, Clock, TrendingUp,
  AlertTriangle, CheckCircle, Zap, Calendar, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getMonitor, getResponseTimes, getIncidents, checkMonitorNow, syncSwagger, getEndpoints } from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import styles from './MonitorDetail.module.css';

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: accent + '33', background: accent + '0a' } : {}}>
      <div className={styles.statIcon} style={accent ? { color: accent, background: accent + '15' } : {}}>
        {icon}
      </div>
      <div className={styles.statBody}>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.value}ms
        </p>
      ))}
    </div>
  );
}

export default function MonitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [timeRange, setTimeRange] = useState(24);

  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [importingSwagger, setImportingSwagger] = useState(false);
  const [endpoints, setEndpoints] = useState([]);

  const fetchEndpoints = useCallback(async () => {
  try {
    const res = await getEndpoints(id);
    setEndpoints(res.data.endpoints || []);
  } catch (error) {
    console.error(error);
  }
}, [id]);

  const fetchAll = useCallback(async () => {
    try {
      const [monRes, chartRes, incRes] = await Promise.all([
        getMonitor(id),
        getResponseTimes(id, timeRange),
        getIncidents({ monitorId: id, limit: 10 }),
      ]);
      setMonitor(monRes.data.monitor);
      setChartData(
        chartRes.data.checks
          .filter(c => c.responseTime !== null)
          .map(c => ({
            time: format(new Date(c.timestamp), 'HH:mm'),
            responseTime: c.responseTime,
            status: c.status,
          }))
          .reverse()
      );
      setIncidents(incRes.data.incidents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, timeRange]);

  useEffect(() => {
    fetchAll();
    fetchEndpoints();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchEndpoints]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await checkMonitorNow(id);
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleSwaggerImport = async () => {
  if (!swaggerUrl.trim()) return;

  try {
    setImportingSwagger(true);

    await syncSwagger(id, swaggerUrl);

    await fetchEndpoints();

    setSwaggerUrl('');
  } catch (error) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
      'Failed to import swagger'
    );
  } finally {
    setImportingSwagger(false);
  }
};

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(
      monitor.apiKey
    );

    alert('API Key copied');
  } catch (error) {
    console.error(error);
  }
};

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-3)' }}>Monitor not found.</p>
        <Link to="/dashboard" className={styles.backLink}>← Back</Link>
      </div>
    );
  }

  const statusColor = monitor.status === 'up' ? 'var(--green)' : monitor.status === 'down' ? 'var(--red)' : 'var(--yellow)';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className={styles.titleRow}>
              <span className={styles.statusDot} style={{ background: statusColor }} />
              <h1 className={styles.title}>{monitor.name}</h1>
            </div>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.url}
            >
              {monitor.url}
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
        <button
          className={styles.checkBtn}
          onClick={handleCheckNow}
          disabled={checking}
        >
          <RefreshCw size={13} className={checking ? styles.spinning : ''} />
          {checking ? 'Checking...' : 'Check now'}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Uptime (24h)"
          value={monitor.uptime24h !== null ? `${monitor.uptime24h}%` : '—'}
          accent={monitor.uptime24h >= 99 ? '#22c55e' : monitor.uptime24h >= 95 ? '#eab308' : '#f43f5e'}
        />
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Uptime (7d)"
          value={monitor.uptime7d !== null ? `${monitor.uptime7d}%` : '—'}
        />
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Uptime (30d)"
          value={monitor.uptime30d !== null ? `${monitor.uptime30d}%` : '—'}
        />
        <StatCard
          icon={<Zap size={15} />}
          label="Avg Response"
          value={monitor.avgResponseTime24h ? `${monitor.avgResponseTime24h}ms` : '—'}
          sub="last 24h"
        />
        <StatCard
          icon={<Clock size={15} />}
          label="Last Response"
          value={monitor.lastResponseTime ? `${monitor.lastResponseTime}ms` : '—'}
        />
        <StatCard
          icon={<AlertTriangle size={15} />}
          label="Total Incidents"
          value={monitor.totalIncidents ?? 0}
          accent={monitor.totalIncidents > 0 ? '#f43f5e' : undefined}
        />
      </div>

      {/* Response Time Chart */}
      {/* <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Activity size={15} />
            Response Time
          </div>
          <div className={styles.timeToggle}>
            {[6, 24, 48].map(h => (
              <button
                key={h}
                className={`${styles.timeBtn} ${timeRange === h ? styles.active : ''}`}
                onClick={() => setTimeRange(h)}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chart}>
          {chartData.length === 0 ? (
            <div className={styles.noData}>No data available yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}ms`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  fill="url(#rtGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div> */}

      {/* Incidents */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <AlertTriangle size={15} />
            Recent Incidents
          </div>
        </div>

        {incidents.length === 0 ? (
          <div className={styles.noIncidents}>
            <CheckCircle size={18} />
            <span>No incidents recorded</span>
          </div>
        ) : (
          <div className={styles.incidentList}>
            {incidents.map(inc => (
              <div key={inc._id} className={`${styles.incident} ${inc.status === 'ongoing' ? styles.ongoing : ''}`}>
                <div className={styles.incidentLeft}>
                  <span className={`${styles.incidentBadge} ${styles[inc.status]}`}>
                    {inc.status === 'ongoing' ? 'Ongoing' : 'Resolved'}
                  </span>
                  <div>
                    <p className={styles.incidentTime}>
                      {format(new Date(inc.startedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                    {inc.cause && <p className={styles.incidentCause}>{inc.cause}</p>}
                  </div>
                </div>
                <div className={styles.incidentRight}>
                  {inc.status === 'resolved' ? (
                    <span className={styles.duration}>{formatDuration(inc.duration)}</span>
                  ) : (
                    <span className={styles.ongoing}>
                      {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: false })} ago
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monitor info */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Calendar size={15} />
            Monitor Info
          </div>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Check interval</span>
            <span className={styles.infoValue}>{monitor.interval} minutes</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Last checked</span>
            <span className={styles.infoValue}>
              {monitor.lastChecked
                ? formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true })
                : 'Never'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Created</span>
            <span className={styles.infoValue}>
              {format(new Date(monitor.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue} style={{ color: statusColor, textTransform: 'capitalize' }}>
              {monitor.status}
            </span>
          </div>
        </div>
      </div>


    
      {/* <div className={styles.section}>
  <div className={styles.sectionHeader}>
    <div className={styles.sectionTitle}>
      API Key
    </div>
  </div>

  <p
    style={{
      color: 'var(--text-3)',
      marginBottom: 12,
      fontSize: 13,
    }}
  >
    Use this key in your other project as the
    X-Monitor-Key header when posting to
    /api-event.
  </p>

  <div
    style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    }}
  >
    <code
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 8,
        background: '#111827',
        overflow: 'auto',
      }}
    >
      {monitor.apiKey}
    </code>

    <button
      className={styles.checkBtn}
      onClick={copyApiKey}
    >
      Copy
    </button>
  </div>
</div> */}

      <div className={styles.section}>
  <div className={styles.sectionHeader}>
    <div className={styles.sectionTitle}>
      Swagger Endpoints
    </div>
  </div>

  {endpoints.length === 0 ? (
    <div>
      <input
        type="text"
        value={swaggerUrl}
        onChange={(e) =>
          setSwaggerUrl(e.target.value)
        }
        placeholder="https://your-api.com/swagger.json"
        style={{
          width: '100%',
          padding: 12,
          marginBottom: 12,
        }}
      />

      <button
        className={styles.checkBtn}
        onClick={handleSwaggerImport}
        disabled={importingSwagger}
      >
        {importingSwagger
          ? 'Importing...'
          : 'Import Swagger'}
      </button>
    </div>
  ) : (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
        }}
      >
        <button
          className={styles.checkBtn}
          onClick={handleSwaggerImport}
          disabled={importingSwagger}
        >
          {importingSwagger
            ? 'Refreshing...'
            : 'Re-import'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {endpoints.map((endpoint) => (
          <div
            key={endpoint._id}
            onClick={() =>
              navigate(
                `/monitors/${id}/endpoints/${endpoint._id}`
              )
            }
            style={{
              cursor: 'pointer',
              padding: 14,
              borderRadius: 10,
              border:
                '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background:
                    endpoint.method === 'GET'
                      ? '#22c55e'
                      : endpoint.method === 'POST'
                      ? '#3b82f6'
                      : endpoint.method === 'PUT'
                      ? '#eab308'
                      : '#ef4444',
                  color: '#fff',
                  fontSize: 12,
                }}
              >
                {endpoint.method}
              </span>

              <strong>
                {endpoint.path}
              </strong>

              <span
  style={{
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    background:
      endpoint.monitorMode === "cron"
        ? "#16a34a"
        : "#f59e0b",
    color: "#fff",
  }}
>
  {endpoint.monitorMode === "cron"
    ? "AUTO"
    : "MANUAL"}
</span>

              <span
                style={{
                  color: 'var(--text-3)',
                }}
              >
                {endpoint.summary}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 20,
                marginTop: 10,
                fontSize: 13,
              }}
            >
              <span>
                Status:
                {" "}
                <strong
                  style={{
                    color:
                      endpoint.status === "active"
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {endpoint.status}
                </strong>
              </span>

              <span>
                Code:
                {' '}
                {endpoint.lastStatusCode ??
                  '-'}
              </span>

              <span>
                Response:
                {' '}
                {endpoint.lastResponseTime ??
                  '-'}
                ms
              </span>

              <span>
                Requests:
                {' '}
                {endpoint.totalRequests}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>


    </div>
  );
}
