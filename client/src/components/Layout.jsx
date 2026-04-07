import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

const merchantNav = [
  { path: '/dashboard', label: 'Dashboard', icon: '◎' },
  { path: '/menu', label: 'Menu', icon: '☰' },
  { path: '/qr-code', label: 'QR Code', icon: '⊞' },
  { path: '/transactions', label: 'Activity', icon: '⇄' },
];

const customerNav = [
  { path: '/wallet', label: 'Rewards Wallet', icon: '◈' },
  { path: '/redeem', label: 'Redeem Rewards', icon: '✦' },
  { path: '/transactions', label: 'Activity', icon: '⇄' },
];

export default function Layout({ children }) {
  const { user, logout, isMerchant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav tap)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const navItems = isMerchant ? merchantNav : customerNav;

  return (
    <div className="sp-layout">
      {/* ── Mobile Overlay ───────────────────────────── */}
      <div
        className={`sp-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={`sp-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo + Close */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <Link to={isMerchant ? '/dashboard' : '/wallet'} style={{
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #EFBF4A, #F5D07A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              SafiPoints
            </Link>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              marginTop: 4,
              fontWeight: 500,
            }}>
              {isMerchant ? 'Business Console' : 'Customer Rewards'}
            </div>
          </div>
          <button
            className="sp-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
            padding: '0 12px', marginBottom: 8,
          }}>
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(239, 191, 74, 0.1)' : 'transparent',
                transition: 'all 0.15s',
                marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 15,
                  opacity: isActive ? 1 : 0.5,
                  color: isActive ? '#EFBF4A' : 'inherit',
                }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Block */}
        <div style={{
          padding: '16px 16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #EFBF4A, #F5D07A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#0F1524',
            }}>
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.name || user?.email}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                {isMerchant ? 'Business Manager' : user?.tier?.toUpperCase() || 'MEMBER'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', borderRadius: 6,
            fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="sp-main">
        {/* Top Bar */}
        <div className="sp-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="sp-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <div className="sp-hamburger-icon">
                <span />
                <span />
                <span />
              </div>
            </button>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {isMerchant ? 'Business Workspace' : 'Customer Workspace'} · SafiPoints
            </div>
          </div>
          <a href="https://testnet.xrpl.org" target="_blank" rel="noreferrer" style={{
            fontSize: 12, color: 'var(--gold)', textDecoration: 'none',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            Verification Network
          </a>
        </div>

        <div className="sp-main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
