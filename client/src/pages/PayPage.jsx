import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    label: 'M-Pesa',
    sublabel: 'Safaricom Mobile Money',
    icon: '📱',
    color: '#4CAF50',
  },
  {
    id: 'card',
    label: 'Debit / Credit Card',
    sublabel: 'Visa · Mastercard · Amex',
    icon: '💳',
    color: '#1A56DB',
  },
  {
    id: 'cash',
    label: 'Cash',
    sublabel: 'Pay at the counter',
    icon: '💵',
    color: '#6B7280',
  },
];

const PROCESSING_STEPS = [
  { label: 'Connecting securely…',    icon: '🔒' },
  { label: 'Verifying your details…', icon: '🔍' },
  { label: 'Processing payment…',     icon: '⚡' },
  { label: 'Recording your rewards…', icon: '✦' },
  { label: 'Payment confirmed!',       icon: '✓' },
];

export default function PayPage() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const order    = state?.order;
  const merchant = state?.merchant;

  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!selected) return;
    setProcessing(true);
    setError('');

    for (let i = 0; i < PROCESSING_STEPS.length - 1; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 650 + Math.random() * 350));
    }
    setStep(PROCESSING_STEPS.length - 1);

    try {
      const res = await api.post(`/public/order/${orderId}/pay`, { method: selected });
      await new Promise(r => setTimeout(r, 700));
      navigate(`/order-success/${orderId}`, {
        replace: true,
        state: { paymentData: res.data, merchant },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="pp-page">
        <div className="pp-notfound">
          <div className="pp-notfound-icon">🍽️</div>
          <h2>Order not found</h2>
          <p>Please go back and place a new order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      {/* Ambient glow */}
      <div className="pp-ambient" />

      <div className="pp-card">

        {/* ── Header ────────────────────────────────── */}
        <div className="pp-header">
          <div className="pp-header-brand">
            <span className="mp-brand-dot" /> SafiPoints
          </div>
          <h1 className="pp-title">Complete Payment</h1>
          <p className="pp-merchant">{merchant?.name}</p>
        </div>

        {/* ── Order Summary ─────────────────────────── */}
        <div className="pp-summary">
          <div className="pp-summary-top">
            <span className="pp-summary-label">Order {order.orderNumber}</span>
            <span className="pp-summary-total">KES {order.total?.toLocaleString()}</span>
          </div>
          <div className="pp-summary-divider" />
          <div className="pp-summary-items">
            {order.items?.map((item, i) => (
              <div key={i} className="pp-summary-item">
                <span className="pp-summary-item-name">{item.quantity}× {item.name}</span>
                <span className="pp-summary-item-price">KES {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!processing ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── SAFI Reward Preview ───────────────── */}
              {state?.safiPreview > 0 && (
                <div className="pp-reward-banner">
                  <div className="pp-reward-banner-icon">✦</div>
                  <div className="pp-reward-banner-text">
                    <strong>You'll earn KES {(state.safiPreview * (merchant?.earnRate || 0.1)).toFixed(0)} cashback</strong>
                    <span> as {state.safiPreview} SAFI with this payment</span>
                  </div>
                </div>
              )}

              {/* ── Payment Methods ───────────────────── */}
              <div className="pp-methods">
                <p className="pp-methods-label">How would you like to pay?</p>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    className={`pp-method ${selected === m.id ? 'pp-method--active' : ''}`}
                    onClick={() => setSelected(m.id)}
                  >
                    <div className="pp-method-icon-wrap" style={{ '--method-color': m.color }}>
                      <span className="pp-method-icon">{m.icon}</span>
                    </div>
                    <div className="pp-method-text">
                      <span className="pp-method-label">{m.label}</span>
                      <span className="pp-method-sub">{m.sublabel}</span>
                    </div>
                    <div className={`pp-method-check ${selected === m.id ? 'pp-method-check--on' : ''}`}>
                      {selected === m.id && <span>✓</span>}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="pp-error-msg">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* ── Pay CTA ───────────────────────────── */}
              <div className="pp-cta-wrap">
                <motion.button
                  className={`pp-pay-btn ${!selected ? 'pp-pay-btn--disabled' : ''}`}
                  disabled={!selected}
                  onClick={handlePay}
                  whileTap={selected ? { scale: 0.97 } : {}}
                >
                  <span className="pp-pay-btn-label">Pay Now</span>
                  <span className="pp-pay-btn-amount">KES {order.total?.toLocaleString()}</span>
                </motion.button>
                <p className="pp-cta-note">🔒 Secured · 256-bit encryption</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              className="pp-processing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated ring */}
              <div className="pp-proc-ring-wrap">
                <svg className="pp-proc-ring" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" className="pp-proc-ring-track" />
                  <motion.circle
                    cx="40" cy="40" r="34"
                    className="pp-proc-ring-fill"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - (step + 1) / PROCESSING_STEPS.length)}`}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={step}
                    className="pp-proc-icon"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {PROCESSING_STEPS[step].icon}
                  </motion.span>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  className="pp-proc-label"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {PROCESSING_STEPS[step].label}
                </motion.p>
              </AnimatePresence>

              {/* Step dots */}
              <div className="pp-proc-dots">
                {PROCESSING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`pp-proc-dot ${i <= step ? 'pp-proc-dot--done' : ''} ${i === step ? 'pp-proc-dot--active' : ''}`}
                  />
                ))}
              </div>

              <p className="pp-proc-note">Please do not close this page</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
