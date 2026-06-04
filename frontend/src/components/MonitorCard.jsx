import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Trash2, ExternalLink, Pause, Play, RefreshCw } from 'lucide-react';
import { deleteMonitor, updateMonitor, checkMonitorNow } from '../utils/api';
import styles from './MonitorCard.module.css';

function StatusBadge({ status }) {
  const cfg = {
    up:      { label: 'Up',      cls: styles.up },
    down:    { label: 'Down',    cls: styles.down },
    pending: { label: 'Pending', cls: styles.pending },
  };
  const { label, cls } = cfg[status] || cfg.pending;
  return (
    <span className={`${styles.badge} ${cls}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}

function UptimeBar({ checks }) {
  // Show last 30 checks as colored bars
  const bars = Array.from({ length: 30 }, (_, i) => {
    const check = checks?.[i];
    if (!check) return 'empty';
    return check.status;
  });

  return (
    <div className={styles.uptimeBars}>
      {bars.map((s, i) => (
        <div
          key={i}
          className={`${styles.bar} ${styles[s] || styles.empty}`}
          title={s}
        />
      ))}
    </div>
  );
}

export default function MonitorCard({ monitor, onUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete monitor "${monitor.name}"?`)) return;
    try {
      await deleteMonitor(monitor._id);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async () => {
    try {
      await updateMonitor(monitor._id, { isActive: !monitor.isActive });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
    setMenuOpen(false);
  };

  const handleCheckNow = async () => {
    setLoading(true);
    setMenuOpen(false);
    try {
      await checkMonitorNow(monitor._id);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (ms) => {
    if (ms === null || ms === undefined) return '—';
    return `${ms}ms`;
  };

  const formatUptime = (val) => {
    if (val === null || val === undefined) return '—';
    return `${val}%`;
  };

  const timeSince = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`${styles.card} ${!monitor.isActive ? styles.inactive : ''}`}>
      <div className={styles.left}>
        <StatusBadge status={monitor.isActive ? monitor.status : 'pending'} />
        <div className={styles.info}>
          <Link to={`/monitors/${monitor._id}`} className={styles.name}>
            {monitor.name}
          </Link>
          <div className={styles.url}>
            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
              {monitor.url}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.center}>
        <UptimeBar checks={monitor.recentChecks} />
      </div>

      <div className={styles.right}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{formatUptime(monitor.uptime24h)}</span>
          <span className={styles.metricLabel}>24h uptime</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{formatResponseTime(monitor.lastResponseTime)}</span>
          <span className={styles.metricLabel}>Response</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{timeSince(monitor.lastChecked)}</span>
          <span className={styles.metricLabel}>Last check</span>
        </div>

        <div className={styles.actions}>
          {loading && <RefreshCw size={13} className={styles.spinning} />}
          <div className={styles.menuWrap}>
            <button
              className={styles.menuBtn}
              onClick={() => setMenuOpen(v => !v)}
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <>
                <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
                <div className={styles.menu}>
                  <button onClick={handleCheckNow} className={styles.menuItem}>
                    <RefreshCw size={13} /> Check now
                  </button>
                  <button onClick={handleToggle} className={styles.menuItem}>
                    {monitor.isActive
                      ? <><Pause size={13} /> Pause</>
                      : <><Play size={13} /> Resume</>}
                  </button>
                  <div className={styles.menuDivider} />
                  <button onClick={handleDelete} className={`${styles.menuItem} ${styles.danger}`}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
