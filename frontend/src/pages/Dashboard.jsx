import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getMonitors } from '../utils/api';
import MonitorCard from '../components/MonitorCard';
import CreateMonitorModal from '../components/CreateMonitorModal';
import styles from './Dashboard.module.css';
import CreateMonitorDrawer from '../components/CreateMonitorDrawer';

export default function Dashboard() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [showCreate, setShowCreate] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitors = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getMonitors();
      setMonitors(res.data.monitors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
    // Auto-refresh every 30s
    const interval = setInterval(() => fetchMonitors(true), 30000);
    return () => clearInterval(interval);
  }, [fetchMonitors]);

  const upCount = monitors.filter(m => m.status === 'up').length;
  const downCount = monitors.filter(m => m.status === 'down').length;
  const pendingCount = monitors.filter(m => m.status === 'pending').length;
  const avgUptime = monitors.length
    ? (monitors.reduce((sum, m) => sum + (m.uptime24h || 0), 0) / monitors.filter(m => m.uptime24h !== null).length || 0).toFixed(1)
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Monitors</h1>
          <p className={styles.subtitle}>
            {monitors.length} monitor{monitors.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchMonitors(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? styles.spinning : ''} />
            Refresh
          </button>
          <button className={styles.createBtn} onClick={() => setDrawerOpen(true)}>
            <Plus size={15} />
            New Monitor
          </button>
        </div>
      </div>

      {/* Stats row */}
      {monitors.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statIcon} style={{ background:'var(--green-dim)', color:'var(--green)' }}>
              <CheckCircle size={15} />
            </div>
            <div>
              <p className={styles.statValue}>{upCount}</p>
              <p className={styles.statLabel}>Operational</p>
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon} style={{ background:'var(--red-dim)', color:'var(--red)' }}>
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className={styles.statValue}>{downCount}</p>
              <p className={styles.statLabel}>Down</p>
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon} style={{ background:'var(--yellow-dim)', color:'var(--yellow)' }}>
              <Clock size={15} />
            </div>
            <div>
              <p className={styles.statValue}>{pendingCount}</p>
              <p className={styles.statLabel}>Pending</p>
            </div>
          </div>
          {avgUptime !== null && (
            <div className={styles.stat}>
              <div className={styles.statIcon} style={{ background:'var(--accent-glow)', color:'var(--accent-2)' }}>
                <TrendingUp size={15} />
              </div>
              <div>
                <p className={styles.statValue}>{avgUptime}%</p>
                <p className={styles.statLabel}>Avg Uptime 24h</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monitor list */}
      {loading ? (
        <div className={styles.loading}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : monitors.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Activity size={28} />
          </div>
          <h3>No monitors yet</h3>
          <p>Create your first monitor to start tracking uptime</p>
          <button className={styles.createBtn} onClick={() => setDrawerOpen(true)}>
            <Plus size={15} />
            Create monitor
          </button>
        </div>
      ) : (
        <div className={styles.monitorList}>
          {monitors.map((monitor, i) => (
            <div key={monitor._id} style={{ animationDelay: `${i * 0.05}s` }}>
              <MonitorCard monitor={monitor} onUpdate={() => fetchMonitors(true)} />
            </div>
          ))}
        </div>
      )}

      {/* {showCreate && (
        <CreateMonitorModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchMonitors(true); }}
        />
      )} */}

      <CreateMonitorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => { setDrawerOpen(false); fetchMonitors(true); }}
      />
    </div>
  );
}

function Activity({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
