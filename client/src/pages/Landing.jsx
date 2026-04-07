import { Link } from 'react-router-dom';

const features = [
  {
    icon: '✦',
    title: 'Trusted Record of Rewards',
    text: 'Every reward earned and redeemed is recorded with a clear audit trail, improving confidence for both customers and management.',
  },
  {
    icon: '→',
    title: 'Immediate Customer Value',
    text: 'Guests receive rewards at checkout without extra steps, helping increase satisfaction and repeat visits.',
  },
  {
    icon: '↻',
    title: 'Simple Redemption Experience',
    text: 'Customers apply rewards instantly at the point of sale, while your team keeps full visibility into program activity.',
  },
];

const stats = [
  { value: 'Real-Time', label: 'Reward Posting' },
  { value: 'Low Cost', label: 'Program Operations' },
  { value: 'Clear', label: 'Performance Tracking' },
  { value: 'Scalable', label: 'Multi-Location Ready' },
];

export default function Landing() {
  return (
    <div style={{ background: '#0F1524', minHeight: '100vh' }}>
      {/* ── Nav ──────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15, 21, 36, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{
          fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #EFBF4A, #F5D07A)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SafiPoints
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}>
            Sign In
          </Link>
          <Link to="/register" className="sp-btn sp-btn-gold sp-btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="sp-hero">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 9999,
          background: 'rgba(239, 191, 74, 0.08)',
          border: '1px solid rgba(239, 191, 74, 0.15)',
          color: '#EFBF4A', fontSize: 13, fontWeight: 600,
          letterSpacing: '0.04em', marginBottom: 28,
          position: 'relative', zIndex: 1,
        }}>
          Built for growth-minded restaurants
        </div>

        <h1 className="sp-display" style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          maxWidth: 800,
          marginBottom: 20,
          position: 'relative', zIndex: 1,
        }}>
          Turn everyday transactions into{' '}
          <span style={{
            background: 'linear-gradient(135deg, #EFBF4A, #F5D07A)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            measurable customer loyalty.
          </span>
        </h1>

        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.45)',
          maxWidth: 560, lineHeight: 1.7,
          marginBottom: 40,
          position: 'relative', zIndex: 1,
        }}>
          SafiPoints helps restaurant leaders strengthen retention, improve repeat spend,
          and run loyalty programs with clear business accountability.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <Link to="/register" className="sp-btn sp-btn-gold sp-btn-lg">
            Launch Your Program
          </Link>
          <Link to="/register" className="sp-btn sp-btn-lg" style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Explore Merchant Setup →
          </Link>
        </div>

        {/* ── Stats Bar ──────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16, overflow: 'hidden',
          maxWidth: 700, width: '100%',
          marginTop: 72,
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 1,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: '24px 16px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#EFBF4A', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ───────────────────────────────── */}
        <div className="sp-features" style={{ position: 'relative', zIndex: 1 }}>
          {features.map((f, i) => (
            <div key={i} className="sp-feature-card">
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(239, 191, 74, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 20,
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>
                {f.title}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                {f.text}
              </div>
            </div>
          ))}
        </div>

        {/* ── How It Works ───────────────────────────── */}
        <div style={{
          maxWidth: 700, width: '100%', marginTop: 80,
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
            color: '#EFBF4A', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Operating Model
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', title: 'Onboard your business', desc: 'Set up your merchant profile and establish your loyalty program foundation.' },
              { step: '02', title: 'Reward customer purchases', desc: 'Eligible transactions automatically trigger loyalty value for customers.' },
              { step: '03', title: 'Monitor performance', desc: 'Track activity with transparent records that support informed decision-making.' },
              { step: '04', title: 'Drive repeat visits', desc: 'Customers redeem rewards at checkout, reinforcing retention and lifetime value.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 24, padding: '24px 0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: 'rgba(239, 191, 74, 0.4)',
                  fontFamily: 'monospace', flexShrink: 0, paddingTop: 2,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────── */}
        <div style={{
          marginTop: 80, padding: '48px 40px',
          background: 'rgba(239, 191, 74, 0.04)',
          border: '1px solid rgba(239, 191, 74, 0.1)',
          borderRadius: 20, maxWidth: 600, width: '100%',
          textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <div className="sp-display" style={{
            fontSize: 28, fontWeight: 700, color: 'white',
            marginBottom: 12, letterSpacing: '-0.02em',
          }}>
            Ready to scale customer loyalty with discipline?
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Build a structured rewards engine that supports growth, retention, and stronger unit economics.
          </p>
          <Link to="/register" className="sp-btn sp-btn-gold sp-btn-lg">
            Create Business Account
          </Link>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div style={{
          marginTop: 80,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.2)', fontSize: 12,
          position: 'relative', zIndex: 1,
        }}>
          SafiPoints &middot; Built on XRPL &middot; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
