import { useState } from 'react';
import { X, Globe, AlertCircle } from 'lucide-react';
import { createMonitor } from '../utils/api';
import styles from './CreateMonitorModal.module.css';

const INTERVALS = [
  { value: 1, label: 'Every 1 minute' },
  { value: 2, label: 'Every 2 minutes' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every 1 hour' },
];

export default function CreateMonitorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', url: '', interval: 5 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createMonitor({
        name: form.name,
        url: form.url.startsWith('http') ? form.url : `https://${form.url}`,
        interval: parseInt(form.interval),
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create monitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <div className={styles.modalIcon}><Globe size={15} /></div>
            <span>New Monitor</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Monitor name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="My Website"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>URL to monitor</label>
            <input
              type="text"
              name="url"
              value={form.url}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://example.com"
              required
            />
            <p className={styles.hint}>We'll send HTTP GET requests to this URL</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Check frequency</label>
            <select
              name="interval"
              value={form.interval}
              onChange={handleChange}
              className={styles.select}
            >
              {INTERVALS.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Create monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
