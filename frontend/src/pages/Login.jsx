import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
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
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Welcome Back to Monitoring App</h1>
          <p className={styles.subtitle}>Sign in to your UpTimeWatch account</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${styles.input} ${styles.inputWithIcon}`}
                placeholder="••••••••"
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Sign in'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account? <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
