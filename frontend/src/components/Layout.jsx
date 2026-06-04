import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          {/* <div className={styles.logoIcon}>
            <Activity size={16} strokeWidth={2.5} />
          </div> */}
          <span>UpTime</span>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <LayoutDashboard size={15} />
            <span>Monitors</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
